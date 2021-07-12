import discord
from discord.ext import commands
import asyncio

import database
import guild_logging
import converters

import datetime


class Admins(commands.Cog, name="Administracja serwera"):
    def __init__(self, bot):
        self.bot = bot

    # ------ EVENTS ------
    # on_ready
    @commands.Cog.listener()
    async def on_ready(self):
        print(f"Moduł {__name__} został załadowany")

    # on_raw_reaction_add - when clicking option below task (👍, 👎, ❌)
    @commands.Cog.listener()
    async def on_raw_reaction_add(self, payload):
        # TODO add emoji :x: processing (deleting task)
        if payload.emoji.name == '👍':
            # Load task data & check if it's in database
            database.cursor.execute("SELECT COUNT(taskID), taskID, taskFor, taskForDiscordID, reward, made, channelDiscordID, messageDiscordID, madeByDiscordID "
                                    "FROM guildsAdminTasks WHERE messageDiscordID = %s", (payload.message_id,))
            task = database.cursor.fetchall()[0]
            database.connection.commit()

            if task[0] <= 0:
                print(f"Na serwerze {payload.guild_id} wywołano {__name__}.on_raw_reaction_add() - wiadomość {payload.message_id} nie jest zadaniem, "
                      f"dlatego nastąpi przerwanie działania procedury...")
                return

            # Check if owner clicked the reaction
            if payload.user_id == self.bot.get_guild(payload.guild_id).owner.id:
                # Load guild from database
                database.cursor.execute("SELECT COUNT(guildID), guildID FROM guilds WHERE guildDiscordID = %s", (payload.guild_id,))
                guild_id = database.cursor.fetchall()[0]
                database.connection.commit()

                if guild_id[0] <= 0:
                    guild_not_found_info = self.bot.get_channel(int(task[6])).send(self.bot.db_guild_not_found_info + ". *Czyszczenie wiadomości za 15 sekund...*")
                    await guild_not_found_info.delete(delay=15.0)
                    print(self.bot.db_guild_not_found_console.format(self.bot.get_guild(payload.guild_id).name, payload.guild_id))
                    return

                guild_id = int(guild_id[1])

                # Check if "made" is not 2 (approved by owner). If "made" is 0 (not done yet), ask if owner is sure to approve task just now before it's even done
                if task[5] == 2:
                    print(f"Na serwerze {payload.guild_id} wywołano {__name__}.on_raw_reaction_add() - użytkownik {payload.user_id} (właściciel serwera) próbował zaakceptować zadanie, jednak 'made' "
                          f"aktualnie wynosi 2 (zadanie zaakceptowane przez właściciela)")
                    return
                elif task[5] == 0:
                    is_sure_message = await self.bot.get_channel(payload.channel_id).send(content=":question: Czy na pewno chcesz już teraz zaakceptować wykonanie tego zadania, pomimo, "
                                                                                                  "że nie zostało ono jeszcze oznaczone jako wykonane i nie oczekuje na weryfikację? "
                                                                                                  "(:white_check_mark: / :x:)")
                    await is_sure_message.add_reaction('✅')
                    await is_sure_message.add_reaction('❌')

                    def check_reaction(r, u):
                        return u == self.bot.get_user(payload.user_id) and str(r.emoji) in ['✅', '❌']

                    try:
                        is_sure_reaction, is_sure_user = await self.bot.wait_for('reaction_add', check=check_reaction, timeout=60.0)
                        if str(is_sure_reaction.emoji) == '❌':
                            is_sure_canceled_message = await self.bot.get_channel(payload.channel_id).send(":red_circle: Anulowano! *Czyszczenie wiadomości za 10 sekund...*")
                            await is_sure_message.delete(delay=10.0)
                            await is_sure_canceled_message.delete(delay=10.0)
                            return
                    except asyncio.TimeoutError:
                        err = await self.bot.get_channel(payload.channel_id).send(
                            f":hourglass: {self.bot.get_user(payload.user_id).mention}, minął czas oczekiwania na reakcję. Spróbuj ponownie, lecz tym razem się pośpiesz! "
                            f"*Czyszczenie wiadomości za 10 sekund...*")
                        await err.delete(delay=10.0)
                        await is_sure_message.delete(delay=10.0)
                        return

                    await is_sure_message.delete()

                    # Proceed when task was for role (so no one made task and no one gets points)
                    if task[2] == 'role':
                        database.cursor.execute("UPDATE guildsAdminTasks SET made = 2 WHERE taskID = %s", (int(task[1]),))
                        database.connection.commit()

                        text_channels = self.bot.get_guild(payload.guild_id).text_channels

                        for text_channel in text_channels:
                            if text_channel.id == int(task[6]):
                                task_message = await text_channel.fetch_message(int(task[7]))
                                break

                        embed = task_message.embeds[0]
                        embed.set_field_at(3, name="Stan:", value=f"🏆 Zrobione i zweryfikowane (nikomu nie przyznano punktów) {datetime.date.today().strftime('%d.%m.%Y')}", inline=False)

                        await task_message.edit(embed=embed)
                        await task_message.clear_reactions()

                        await guild_logging.notification(f"Zadanie {task[1]} zostało przedwcześnie zweryfikowane przez właściciela serwera")
                        print(f"Zadanie {task[1]} zostało przedwcześnie zweryfikowane przez właściciela serwera")

                        return

                # Save changes to database (change "made" from 0/1 to 2 - approved by owner)
                database.cursor.execute("UPDATE guildsAdminTasks SET made = 2 WHERE taskID = %s", (int(task[1]),))
                database.connection.commit()

                # Get current admin's statistics
                database.cursor.execute("SELECT adminsStats.adminID, adminsStats.points, adminsStats.madeTasks FROM adminsStats, guildsAdmins "
                                        "WHERE guildsAdmins.adminID = adminsStats.adminID AND guildsAdmins.userDiscordID = %s AND guildsAdmins.guildID = %s", (int(task[8]), guild_id))
                admin_stats = database.cursor.fetchall()[0]
                database.connection.commit()

                # Update admin's statistics (add points & made tasks)
                admin_points = admin_stats[1] + task[4]
                admin_made_tasks = admin_stats[2] + 1

                database.cursor.execute("UPDATE adminsStats SET points = %s, madeTasks = %s WHERE adminID = %s", (admin_points, admin_made_tasks, admin_stats[0]))
                database.connection.commit()

                await self.bot.get_user(int(task[8])).send(f"Twoje zadanie zostało zweryfikowane! Otrzymujesz {task[4]} punkty/ów :partying_face:")

                # Update task message embed
                text_channels = self.bot.get_guild(payload.guild_id).text_channels

                for text_channel in text_channels:
                    if text_channel.id == int(task[6]):
                        task_message = await text_channel.fetch_message(int(task[7]))
                        break

                embed = task_message.embeds[0]
                embed.set_field_at(3, name="Stan:", value=f"🏆 Zrobione i zweryfikowane {datetime.date.today().strftime('%d.%m.%Y')}" if task[2] == 'user' else f"🏆 Zrobione przez {self.bot.get_user(int(task[8])).mention} i zweryfikowane {datetime.date.today().strftime('%d.%m.%Y')}", inline=False)

                await task_message.edit(embed=embed)
                await task_message.clear_reactions()

                # Log
                await guild_logging.notification(f"Zadanie {task[1]} zostało zweryfikowane przez właściciela serwera")
                print(f"Zadanie {task[1]} zostało zweryfikowane przez właściciela serwera")

                return

            # Check if user is permitted to take action with the task
            if task[2] == 'user':
                if payload.user_id != int(task[3]):
                    print(f"Na serwerze {payload.guild_id} wywołano {__name__}.on_raw_reaction_add() - użytkownik {payload.user_id} nie jest uprawniony do oznaczania zadania "
                          f"{task[1]} jako wykonane, dlatego nastąpi przerwanie działania procedury (taskFor='user')...")
                    return
            elif self.bot.get_guild(payload.guild_id).get_role(int(task[3])) not in self.bot.get_guild(payload.guild_id).get_member(payload.user_id).roles:
                print(f"Na serwerze {payload.guild_id} wywołano {__name__}.on_raw_reaction_add() - użytkownik {payload.user_id} nie jest uprawniony do oznaczania zadania "
                      f"{task[1]} jako wykonane, dlatego nastąpi przerwanie działania procedury (taskFor='role')...")
                return

            # Check if task's "made" is already 1 or 2 (if it's already waiting for owner's approval or it has been already approved)
            if task[5] != 0:
                print(f"Na serwerze {payload.guild_id} wywołano {__name__}.on_raw_reaction_add() - nie można oznaczyć zadania jako czekające na weryfikację, gdyż 'made' aktualnie wynosi {task[5]}")
                return

            # Save changes to database (change "made" from 0 to 1 - waiting for owner's approval)
            database.cursor.execute("UPDATE guildsAdminTasks SET made = 1 WHERE taskID = %s" if task[2] == 'user' else f"UPDATE guildsAdminTasks SET made = 1, madeByDiscordID = '{payload.user_id}' "
                                                                                                                       f"WHERE taskID = %s", (int(task[1]),))
            database.connection.commit()

            # Update task message embed
            text_channels = self.bot.get_guild(payload.guild_id).text_channels

            for text_channel in text_channels:
                if text_channel.id == int(task[6]):
                    task_message = await text_channel.fetch_message(int(task[7]))
                    break

            embed = task_message.embeds[0]
            embed.set_field_at(3, name="Stan:", value=f"Zrobione ❓ oczekiwanie na weryfikację przez {self.bot.get_guild(payload.guild_id).owner.mention}..." if task[2] == 'user' else f"Zrobione przez {self.bot.get_user(payload.user_id).mention} ❓ oczekiwanie na weryfikację przez {self.bot.get_guild(payload.guild_id).owner.mention}...", inline=False)

            await task_message.edit(embed=embed)
            await task_message.clear_reaction('❌')
            await task_message.add_reaction('👎')
            await task_message.add_reaction('❌')

            # Log
            await guild_logging.notification(f"Zadanie {task[1]} zostało oznaczone jako oczekujące na weryfikację przez właściciela serwera")
            print(f"Zadanie {task[1]} zostało oznaczone jako oczekujące na weryfikację przez właściciela serwera")

        elif payload.emoji.name == '👎':
            # Load task data & check if it's in database
            database.cursor.execute("SELECT COUNT(taskID), taskID, taskFor, taskForDiscordID, reward, made, channelDiscordID, messageDiscordID, madeByDiscordID "
                                    "FROM guildsAdminTasks WHERE messageDiscordID = %s", (payload.message_id,))
            task = database.cursor.fetchall()[0]
            database.connection.commit()

            if task[0] <= 0:
                print(f"Na serwerze {payload.guild_id} wywołano {__name__}.on_raw_reaction_add() - wiadomość {payload.message_id} nie jest zadaniem, "
                      f"dlatego nastąpi przerwanie działania procedury...")
                return

            # Check if owner clicked the reaction
            if payload.user_id != self.bot.get_guild(payload.guild_id).owner.id:
                print(f"Na serwerze {payload.guild_id} wywołano {__name__}.on_raw_reaction_add() - nie można odrzucić wykonania zadania, ponieważ użytkownik nie jest właścicielem serwera, "
                      f"dlatego nastąpi przerwanie działania procedury...")
                return

            # Check if "made" is 1 (waiting for approve by owner)
            if task[5] != 1:
                print(f"Na serwerze {payload.guild_id} wywołano {__name__}.on_raw_reaction_add() - nie można odrzucić wykonania zadania, ponieważ 'made' aktualnie wynosi {task[5]}, "
                      f"dlatego nastąpi przerwanie działania procedury...")
                return

            # Save changes to database (change "made" from 1 to 0 - not done, waiting for mark as waiting for owner's approval)
            database.cursor.execute("UPDATE guildsAdminTasks SET made = 0 WHERE taskID = %s" if task[2] == 'user' else f"UPDATE guildsAdminTasks SET made = 0, madeByDiscordID = 'NONE' "
                                                                                                                       f"WHERE taskID = %s", (int(task[1]),))
            database.connection.commit()

            # Update task message embed
            text_channels = self.bot.get_guild(payload.guild_id).text_channels

            for text_channel in text_channels:
                if text_channel.id == int(task[6]):
                    task_message = await text_channel.fetch_message(int(task[7]))
                    break

            embed = task_message.embeds[0]
            embed.set_field_at(3, name="Stan:", value="Oczekiwanie na wykonanie zadania (poprzednie wykonanie zostało odrzucone przez właściciela serwera) - reakcja 👍...", inline=False)

            await task_message.edit(embed=embed)
            await task_message.clear_reaction('👎')

            # Send info to user who made the task
            await self.bot.get_user(int(task[8])).send(f":postbox: Twoje wykonanie zadania na serwerze *{self.bot.get_guild(payload.guild_id).name}* zostało odrzucone przez właściciela serwera. "
                                                 f"Być może coś zostało zrobione nie tak...?")

            # Log
            await guild_logging.notification(f"Wykonanie zadania {task[1]} zostało odrzucone przez właściciela serwera")
            print(f"Wykonanie zadania {task[1]} zostało odrzucone przez właściciela serwera")

        elif payload.emoji.name == "❌":
            # Load task data & check if it's in database
            database.cursor.execute("SELECT COUNT(taskID), taskID, messageDiscordID, content, channelDiscordID "
                                    "FROM guildsAdminTasks WHERE messageDiscordID = %s", (payload.message_id,))
            task = database.cursor.fetchall()[0]
            database.connection.commit()

            if task[0] <= 0:
                print(f"Na serwerze {payload.guild_id} wywołano {__name__}.on_raw_reaction_add() - wiadomość {payload.message_id} nie jest zadaniem, "
                      f"dlatego nastąpi przerwanie działania procedury...")
                return

            # Check if owner clicked the reaction
            if payload.user_id != self.bot.get_guild(payload.guild_id).owner.id:
                print(f"Na serwerze {payload.guild_id} wywołano {__name__}.on_raw_reaction_add() - nie można usunąć zadania, ponieważ użytkownik nie jest właścicielem serwera, "
                      f"dlatego nastąpi przerwanie działania procedury...")
                return

            # Ask if owner is sure to delete the task
            is_sure_message = await self.bot.get_channel(payload.channel_id).send(content=":question: Czy na pewno chcesz usunąć to zadanie? Jeśli punkty są już przyznane, to nie zostaną odebrane "
                                                                                          "(:white_check_mark: / :x:)")
            await is_sure_message.add_reaction('✅')
            await is_sure_message.add_reaction('❌')

            def check_reaction(r, u):
                return u == self.bot.get_user(payload.user_id) and str(r.emoji) in ['✅', '❌']

            try:
                is_sure_reaction, is_sure_user = await self.bot.wait_for('reaction_add', check=check_reaction, timeout=60.0)
                if str(is_sure_reaction.emoji) == '❌':
                    is_sure_canceled_message = await self.bot.get_channel(payload.channel_id).send(":red_circle: Anulowano! *Czyszczenie wiadomości za 10 sekund...*")
                    await is_sure_message.delete(delay=10.0)
                    await is_sure_canceled_message.delete(delay=10.0)
                    return
            except asyncio.TimeoutError:
                err = await self.bot.get_channel(payload.channel_id).send(
                    f":hourglass: {self.bot.get_user(payload.user_id).mention}, minął czas oczekiwania na reakcję. Spróbuj ponownie, lecz tym razem się pośpiesz! "
                    f"*Czyszczenie wiadomości za 10 sekund...*")
                await err.delete(delay=10.0)
                await is_sure_message.delete(delay=10.0)
                return

            await is_sure_message.delete()

            # Load & delete task message
            text_channels = self.bot.get_guild(payload.guild_id).text_channels

            for text_channel in text_channels:
                if text_channel.id == int(task[4]):
                    task_message = await text_channel.fetch_message(int(task[2]))
                    break

            await task_message.delete()

            # Delete task in database
            database.cursor.execute("DELETE FROM guildsAdminTasks WHERE taskID = %s", (task[1],))
            database.connection.commit()

            await self.bot.get_guild(payload.guild_id).owner.send(f"Pomyślnie usunięto zadanie *{task[3][:50]}*{'...' if len(task[3]) > 50 else ''}")

            await guild_logging.notification(f"Na serwerze {self.bot.get_guild(payload.guild_id).name} usunięto zadanie o ID {task[1]}")
            print(f"Na serwerze {self.bot.get_guild(payload.guild_id).name} usunięto zadanie o ID {task[1]}")

    # ------ COMMANDS ------
    # adminProfile
    @commands.command(name="adminProfile", usage="<użytkownik>", description="Wyświetla statystyki (punkty za zadania, ilość wykonanych, itp.) podanego użytkownika, o ile został on wcześniej zapisany"
                                                                             " jako administrator. Przykład: **t!adminProfile @ktos123**")
    @commands.guild_only()
    async def admin_profile(self, ctx: commands.Context, user: discord.User = None):
        if user is None:
            user = ctx.author

        # Load guild from database
        database.cursor.execute("SELECT COUNT(guildID), guildID FROM guilds WHERE guildDiscordID = %s", (ctx.guild.id,))
        guild_id = database.cursor.fetchall()[0]
        database.connection.commit()

        if guild_id[0] < 1:
            await ctx.send(self.bot.db_guild_not_found_info)
            print(self.bot.db_guild_not_found_console.format(ctx.guild.name, ctx.guild.id))
            return

        guild_id = int(guild_id[1])

        # Check if user which triggered command is saved as admin on this guild
        database.cursor.execute("SELECT COUNT(adminID) FROM guildsAdmins WHERE guildID = %s AND userDiscordID = %s", (guild_id, ctx.author.id))
        is_admin = database.cursor.fetchall()[0][0]
        database.connection.commit()

        if is_admin < 1:
            await ctx.send(":lock: Nie masz uprawnień do użycia tego polecenia! Musisz być oznaczony jako admin na tym serwerze (posiadając odpowiednią rolę lub poprzez polecenie **t!addAdmin**)")
            print(f"Użytkownik {ctx.author.name} ({ctx.author.id}) nie może użyć polecenia adminProfile, gdyż nie jest oznaczony jako admin serwera {ctx.guild.name} ({ctx.guild.id})")
            return

        # Load admin & his stats from database
        database.cursor.execute("SELECT COUNT(guildsAdmins.adminID), guildsAdmins.adminID, guildsAdmins.canCreateTask, "
                                "adminsStats.points, adminsStats.madeTasks, adminsStats.failedTasks, adminsStats.warns FROM guildsAdmins, adminsStats "
                                "WHERE guildsAdmins.adminID = adminsStats.adminID AND guildsAdmins.guildID = %s AND guildsAdmins.userDiscordID = %s", (guild_id, user.id))
        profile = database.cursor.fetchall()[0]
        database.connection.commit()

        if profile[0] < 1:
            await ctx.send(":face_with_monocle: Nie znaleziono profilu admina tego użytkownika! "
                           "Można oznaczyć go jako administratora poprzez nadanie mu odpowiedniej roli (wcześniej ustawionej poleceniem **t!setAdminRole**) lub komendą **t!addAdmin**")
            print(f"Nie znaleziono profilu admina użytkownika {user.name} ({user.id}) na serwerze {ctx.guild.name} ({ctx.guild.id})")
            return

        # Basic info
        admin_id = profile[1]
        warns = profile[6]
        can_create_tasks = profile[2]

        # Tasks info
        points = profile[3]
        made = profile[4]
        failed = profile[5]

        # Create & send embed
        embed = discord.Embed(
            title="**TYTUSOWY PROFIL ADMINA**",
            description=f"Dla użytkownika {user.mention} (właściciel serwera)" if ctx.guild.owner.id == user.id else f"Dla użytkownika {user.mention}",
            color=discord.Color.random()
        )

        embed.add_field(name="Identyfikator", value=admin_id, inline=True)
        embed.add_field(name="Ostrzeżenia (warn'y)", value=warns, inline=True)
        embed.add_field(name="Czy może tworzyć zadania?", value="tak" if can_create_tasks >= 1 or ctx.guild.owner.id == user.id else "nie", inline=True)
        embed.add_field(name="Punkty", value=points, inline=True)
        embed.add_field(name="Wykonane zadania", value=made, inline=True)
        embed.add_field(name="Niewykonane zadania", value=failed, inline=True)

        date = datetime.datetime.now()
        embed.set_footer(text=f"TyTus © {date.year}")

        await ctx.send(embed=embed)

    # addAdmin
    @commands.command(name="addAdmin", usage="<użytkownik> [czy może dodawać zadania? yes / no]", description="Zapisuje podanego użytkownika jako administratora serwera. __Uwaga: nie wpłynie to na"
                                                                                                              " jego uprawnienia czy role, dodaje tylko możliwość uczestnictwa w zadaniach dla "
                                                                                                              "administracji__. Przykład: **t!addAdmin @ktos123 no**")
    @commands.guild_only()
    @commands.has_guild_permissions(administrator=True)
    async def add_admin(self, ctx: commands.Context, user: discord.User, can_create_task: converters.to_mysql_boolean = "no"):
        # Get guild from db
        database.cursor.execute("SELECT COUNT(guildID), guildID FROM guilds WHERE guildDiscordID = %s", (ctx.guild.id,))
        guild_id = database.cursor.fetchall()[0]
        database.connection.commit()

        # Check if guild exists in db
        if guild_id[0] <= 0:
            await ctx.send(self.bot.db_guild_not_found_info)
            print(self.bot.db_guild_not_found_console.format(ctx.guild.name, ctx.guild.id))
            return

        guild_id = guild_id[1]

        # Get the admin's profile
        database.cursor.execute("SELECT COUNT(adminID), adminID FROM guildsAdmins WHERE guildID = %s AND userDiscordID = %s", (guild_id, user.id))
        admin = database.cursor.fetchall()[0]
        database.connection.commit()

        # Check if the admin's profile already exists
        if admin[0] >= 1:
            await ctx.send(":thumbsup: Ten użytkownik jest już zapisany jako administrator. Jeśli chcesz to zmienić, wprowadź **t!removeAdmin <użytkownik> [powód]**")
            await guild_logging.notification(f"Próbowano ponownie dodać administratora o ID {admin[1]}")
            return

        # Create admin's profile
        database.cursor.execute("INSERT INTO guildsAdmins (guildID, userDiscordID, canCreateTask) VALUES (%s, %s, %s)", (guild_id, user.id, can_create_task))
        database.connection.commit()

        # Get created profile's id
        database.cursor.execute("SELECT adminID FROM guildsAdmins ORDER BY adminID DESC LIMIT 1")
        adminID = database.cursor.fetchall()[0][0]
        database.connection.commit()

        # Create admin's statistics profile
        database.cursor.execute("INSERT INTO adminsStats (adminID, points, madeTasks, failedTasks, warns) VALUES (%s, 0, 0, 0, 0)", (adminID,))
        database.connection.commit()

        await ctx.send(f":white_check_mark: Pomyślnie dodano *{user.display_name}* jako administratora tego serwera")
        await guild_logging.notification(f"Nowy administrator ({user.display_name}, {user.id}) na serwerze {ctx.guild.name} ({ctx.guild.id})")

    # removeAdmin
    @commands.command(name="removeAdmin", usage="<użytkownik> [powód]", description="Usuwa tytuł administratora podanemu użytkownikowi. Dodatkowy parametr \"powód\" zostanie wysłany do niego "
                                                                                    "automatycznie za pomocą bota. __Uwaga: nie wpłynie to na jego uprawnienia czy role, lecz "
                                                                                    "odbierze mu możliwość uczestnictwa w zadaniach dla administracji__. Przykład: **t!removeAdmin @ktos123 Zmiana "
                                                                                    "admina, pa pa!**")
    @commands.guild_only()
    @commands.has_guild_permissions(administrator=True)
    async def remove_admin(self, ctx: commands.Context, user: discord.User, *, reason: str = None):
        # Load guild from database
        database.cursor.execute("SELECT COUNT(guildID), guildID FROM guilds WHERE guildDiscordID = %s", (ctx.guild.id,))
        guild_id = database.cursor.fetchall()[0]
        database.connection.commit()

        if guild_id[0] < 1:
            await ctx.send(self.bot.db_guild_not_found_info)
            print(f"Nie można usunąć admina {user.name} ({user.id}), ponieważ nie odnaleziono serwera {ctx.guild.name} ({ctx.guild.id}) w bazie danych")
            return

        guild_id = int(guild_id[1])

        # Check if the admin to delete exists
        database.cursor.execute("SELECT COUNT(adminID), adminID FROM guildsAdmins WHERE guildID = %s AND userDiscordID = %s", (guild_id, user.id))
        admin_id = database.cursor.fetchall()[0]
        database.connection.commit()

        if admin_id[0] < 1:
            await ctx.send(f":face_with_monocle: Podany użytkownik nie jest zapisany jako administrator tego serwera!")
            print(f"Nie można usunąć administratora {user.name} ({user.id}) na serwerze {ctx.guild.name} ({ctx.guild.id}), gdyż ten użytkownik nim nie jest")
            return

        admin_id = int(admin_id[1])

        # Delete admin & his stats
        database.cursor.execute("DELETE FROM guildsAdmins WHERE adminID = %s", (admin_id,))
        database.connection.commit()

        print(f"Usunięto rekord z tabeli 'guildsAdmins' o adminID {admin_id} (usuwanie admina cz. 1/2)...")

        database.cursor.execute("DELETE FROM adminsStats WHERE adminID = %s", (admin_id,))
        database.connection.commit()

        # Send logs
        await guild_logging.notification(f"Usunięto wszystkie dane profilu admina (ID {admin_id}) użytkownika {user.name} ({user.id})")
        print(f"Usunięto rekord z tabeli 'adminsStats' o adminID {admin_id} (usuwanie admina cz. 2/2). Zakończono!")

        await ctx.send(f":white_check_mark: *{user.display_name}* nie jest już administratorem tego serwera. "
                       f"Jego Discord'owe uprawnienia nie uległy zmianie, lecz nie będzie mógł on uczestniczyć w zadaniach dla administracji.")

        if reason is None:
            reason = "**nie określono**"

        await user.send(f":grey_exclamation: Na serwerze *{ctx.guild.name}* odebrano Ci tytuł administratora. Powód: " + reason + "")

    # adminLeaderboard
    @commands.command(name="adminLeaderboard", usage="[ilość wierszy]", description="Wyświetla ranking adminów pod względem punktów. Dodatkowy parametr określa ilość wierszy (np. podając 4 uzyskamy "
                                                                                    "TOP 4 adminów, a podając 20 - TOP 20), która domyślnie wynosi 10. Przykład: **t!adminLeaderboard 3**")
    @commands.guild_only()
    async def admin_leaderboard(self, ctx: commands.Context, rows: int = 10):
        # Load guildID from database
        database.cursor.execute("SELECT COUNT(guildID), guildID FROM guilds WHERE guildDiscordID = %s", (ctx.guild.id,))
        guild_id = database.cursor.fetchall()[0]
        database.connection.commit()

        if guild_id[0] < 1:
            await ctx.send(self.bot.db_guild_not_found_info)
            print(self.bot.db_guild_not_found_console.format(ctx.guild.name, ctx.guild.id))
            return

        guild_id = int(guild_id[1])

        # Load top 10 ('rows') admins by points
        database.cursor.execute("SELECT guildsAdmins.userDiscordID, adminsStats.points FROM guildsAdmins, adminsStats WHERE guildsAdmins.adminID = adminsStats.adminID "
                                "ORDER BY adminsStats.points DESC LIMIT %s", (rows,))
        leaderboard = database.cursor.fetchall()
        database.connection.commit()

        if len(leaderboard) < 1:
            await ctx.send(":face_with_monocle: Wygląda na to, że nie masz żadnych TyTusowych adminów na serwerze. Dodaj ich automatycznie poprzez ustawienie odpowiedniej roli (**t!setAdminRole**) "
                           "lub za pomocą polecenia **t!addAdmin**")
            print(f"Nie można wyświetlić rankingu na serwerze {ctx.guild.name} ({ctx.guild.id}), ponieważ nie ma tu żadnych adminów")
            return

        # Create & send embed
        embed = discord.Embed(
            title=f"**TOP {rows} adminów**",
            description=f"Według punktów za zadania",
            color=discord.Color.random()
        )

        for i, admin in enumerate(leaderboard):
            print(admin[0])

            if ctx.guild.get_member(int(admin[0])) is None:
                continue

            if i == 0:
                embed.add_field(name=f":first_place: **#1** *{ctx.guild.get_member(int(admin[0])).name}*", value=f"Punkty: {admin[1]}", inline=False)
            elif i == 1:
                embed.add_field(name=f":second_place: **#2** *{ctx.guild.get_member(int(admin[0])).name}*", value=f"Punkty: {admin[1]}", inline=False)
            elif i == 2:
                embed.add_field(name=f":third_place: **#3** *{ctx.guild.get_member(int(admin[0])).name}*", value=f"Punkty: {admin[1]}", inline=False)
            else:
                embed.add_field(name=f"**#{i + 1}** *{ctx.guild.get_member(int(admin[0])).name}*", value=f"Punkty: {admin[1]}", inline=False)

        date = datetime.datetime.now()
        embed.set_footer(text=f"TyTus © {date.year}")

        await ctx.send(embed=embed)

    # addTask
    @commands.command(name="addTask", usage="<użytkownik / rola> <ilość dni> [ilość punktów]", description="Tworzy nowe zadanie na kanale na którym została wywołana ta komenda. Tylko podany "
                                                                                                           "podany użytkownik będzie mógł je wykonać (bądź też użytkownicy z podaną rolą). Ilość dni "
                                                                                                           "określa termin na wykonanie zadania. Po wykonaniu, użytkownik musi wcisnąć reakcję "
                                                                                                           ":thumbsup:, po czym właściciel serwera musi sprawdzić czy zadanie faktycznie zostało "
                                                                                                           "zrobione. Następnie zatwierdza i punkty zostają automatycznie przyznane wykonawcy, lub też "
                                                                                                           "odrzuca i użytkownik musi je wykonać ponownie. Wprowadź **t!help admin-tasks**, aby "
                                                                                                           "dowiedzieć się więcej. Przykład: **t!addTask @zarząd 2 5**")
    @commands.guild_only()
    @commands.has_guild_permissions(manage_messages=True)
    async def add_task(self, ctx: commands.Context, task_for: converters.user_or_role, days: int, points: int = 2):
        # Delete message that triggered command
        await ctx.message.delete()

        # Get guild ID & check if it's in database
        database.cursor.execute("SELECT guildID FROM guilds WHERE guildDiscordID = %s", (ctx.guild.id,))
        guild_id = database.cursor.fetchall()
        database.connection.commit()

        if len(guild_id) <= 0:
            err = await ctx.send(f"{self.bot.db_guild_not_found_info} *Czyszczenie wiadomości za 15 sekund...*")
            await err.delete(delay=15.0)
            print(self.bot.db_guild_not_found_console.format(ctx.guild.name, ctx.guild.id))
            return

        guild_id = guild_id[0][0]
        task_for_id = int(task_for[0])
        task_for = task_for[1]

        # Check if user was saved in database as admin & if has permission to create tasks
        if ctx.author.id != ctx.guild.owner.id:
            database.cursor.execute("SELECT COUNT(adminID), adminID, canCreateTask FROM guildsAdmins WHERE userDiscordID = %s AND guildID = %s", (ctx.author.id, guild_id))
            author_admin_profile = database.cursor.fetchall()[0]
            database.connection.commit()

            if author_admin_profile[0] <= 0:
                err = await ctx.send(":lock: Nie jesteś uprawniony do tworzenia zadań (nie zostałeś oznaczony jako administrator za pomocą polecenia **t!addAdmin**)! "
                                     "*Czyszczenie wiadomości za 20 sekund...*")
                await err.delete(delay=20.0)
                print(f"Użytkownik {ctx.author.name} ({ctx.author.id}) nie może utworzyć zadania - nie jest w bazie jako administrator")
                return
            elif author_admin_profile[2] != 1:
                err = await ctx.send(":lock: Nie jesteś uprawniony do tworzenia zadań (w Twoim profilu admina opcja \"może tworzyć zadania?\" jest ustawiona na \"nie\", "
                                     "można to zmienić za pomocą polecenia **t!editAdminCreateTasks**) *Czyszczenie wiadomości za 20 sekund...*")
                await err.delete(delay=20.0)
                print(f"Użytkownik {ctx.author.name} (ID admina: {author_admin_profile[1]}) nie może utworzyć zadania - 'canCreateTask' aktualnie wynosi {author_admin_profile[2]}")
                return

        # Get task's content from user
        def check_msg_author(m):
            return m.author == ctx.author

        info_1 = await ctx.send(":thumbsup: OK, teraz wprowadź treść zadania... Wpisz **cancel** aby anulować")

        try:
            content = await self.bot.wait_for('message', check=check_msg_author, timeout=180.0)
            if content.content == 'cancel':
                info_2 = await ctx.send(":red_circle: Anulowano! *Czyszczenie wiadomości za 10 sekund...*")
                await info_2.delete(delay=10.0)
                await info_1.delete(delay=10.0)
                await content.delete(delay=10.0)
                return
        except asyncio.TimeoutError:
            err = await ctx.send(f":hourglass: {ctx.author.mention}, minął czas oczekiwania na odpowiedź. Spróbuj ponownie, lecz tym razem się pośpiesz! *Czyszczenie wiadomości za 10 sekund...*")
            await err.delete(delay=10.0)
            await info_1.delete(delay=10.0)
            return

        # Delete message with task's content
        await content.delete()

        # Create task's embed & ask if it's ok
        embed_color = discord.Color.random()

        embed = discord.Embed(
            title="TyTusowe zadanko",
            description=content.content,
            color=embed_color
        )

        embed.add_field(name="Dla:", value=self.bot.get_user(task_for_id).mention if task_for == 'user' else ctx.guild.get_role(task_for_id).mention, inline=False)
        embed.add_field(name="Pozostały czas:", value=f"{days} dni", inline=False)
        embed.add_field(name="Nagroda:", value=f"{points} punkty/ów", inline=False)
        embed.add_field(name="Stan:", value="Oczekiwanie na wykonanie zadania - reakcja 👍...", inline=False)

        date = datetime.datetime.now()
        embed.set_footer(text=f"TyTus © {date.year}")

        embed_message = await ctx.send(embed=embed)
        await info_1.edit(content=":question: Czy wszystko się zgadza? (:white_check_mark: / :x:)")
        await info_1.add_reaction('✅')
        await info_1.add_reaction('❌')

        def check_reaction(r, u):
            return u == ctx.author and str(r.emoji) in ['✅', '❌']

        try:
            confirm_reaction, confirm_user = await self.bot.wait_for('reaction_add', check=check_reaction, timeout=60.0)
            if str(confirm_reaction.emoji) == '❌':
                info_2 = await ctx.send(":red_circle: Anulowano! *Czyszczenie wiadomości za 10 sekund...*")
                await info_2.delete(delay=10.0)
                await info_1.delete(delay=10.0)
                await embed_message.delete(delay=10.0)
                return
        except asyncio.TimeoutError:
            err = await ctx.send(f":hourglass: {ctx.author.mention}, minął czas oczekiwania na reakcję. Spróbuj ponownie, lecz tym razem się pośpiesz! *Czyszczenie wiadomości za 10 sekund...*")
            await err.delete(delay=10.0)
            await info_1.delete(delay=10.0)
            await embed_message.delete(delay=10.0)
            return

        await info_1.delete()
        await embed_message.add_reaction('👍')
        await embed_message.add_reaction('❌')

        # Check if task is for user, then check if he's in database as administrator TODO if task is for role, check if everyone with this role is in database as admin, if not - add him/them
        if task_for == "user":
            database.cursor.execute("SELECT COUNT(adminID), adminID FROM guildsAdmins WHERE guildID = %s AND userDiscordID = %s", (guild_id, task_for_id))
            task_for_admin = database.cursor.fetchall()[0]
            database.connection.commit()

            if task_for_admin[0] <= 0:
                await database.add_admin(guild_id, task_for_id, 0)
                await ctx.author.send(f"Użytkownik dla którego utworzyłeś zadanie, został dodany do bazy jako administrator Twojego serwera "
                                      f"(dzięki temu może wykonywać zadania, ale jego discord'owe uprawnienia __nie__ uległy zmianie). "
                                      f"Jeśli chcesz zobaczyć jego profil, wprowadź **t!adminProfile <użytkownik>**")
        else:
            database.cursor.execute("SELECT userDiscordID FROM guildsAdmins WHERE guildID = %s", (guild_id,))
            guild_admins_2d = database.cursor.fetchall()
            database.connection.commit()

            guild_admins = []
            added_to_database = []

            for guild_admin in guild_admins_2d:
                guild_admins.append(int(guild_admin[0]))

            for member in ctx.guild.members:
                for role in member.roles:
                    if role.id == task_for_id:
                        if member.id not in guild_admins:
                            await database.add_admin(guild_id, member.id, 0)
                            added_to_database.append(member.display_name)

            if len(added_to_database) != 0:
                added_to_database_text = ""

                for added_to_database_nick in added_to_database:
                    added_to_database_text = added_to_database_text + added_to_database_nick + ", "

                added_to_database_text = added_to_database_text[:-2]

                nouns_conjugation = ["użytkownik" if len(added_to_database) == 1 else "użytkowników", "został" if len(added_to_database) == 1 else "zostało",
                                     "dodany" if len(added_to_database) == 1 else "dodanych", "administrator" if len(added_to_database) == 1 else "administratorzy",
                                     "może" if len(added_to_database) == 1 else "mogą", "jego" if len(added_to_database) == 1 else "ich"]
                await ctx.author.send(f"{len(added_to_database)} {nouns_conjugation[0]} (*{added_to_database_text}*) {nouns_conjugation[1]} {nouns_conjugation[2]} "
                                      f"do bazy jako {nouns_conjugation[3]} Twojego serwera (dzięki temu {nouns_conjugation[4]} wykonywać zadania, ale {nouns_conjugation[5]} discord'owe uprawnienia "
                                      f"__nie__ uległy zmianie).")

        # Insert task record to guildsAdminTasks table
        database.cursor.execute("INSERT INTO guildsAdminTasks (guildID, channelDiscordID, messageDiscordID, taskFor, taskForDiscordID, madeByDiscordID, reward, made, content) "
                                "VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s)",
                                (guild_id, ctx.channel.id, embed_message.id, task_for, task_for_id, task_for_id if task_for == 'user' else 'NONE', points, 0, content.content))
        database.connection.commit()

        await ctx.author.send("Zadanie zostało pomyślnie utworzone. Wprowadź **t!help admin-tasks**, żeby dowiedzieć się, do czego służą poszczególne reakcje pod zadaniem")
        await guild_logging.notification(f"Na serwerze {ctx.guild.name} utworzono zadanie. Treść: {content.content}")
        print(f"Na serwerze {ctx.guild.name} utworzono zadanie. Treść: {content.content}")


def setup(bot):
    bot.add_cog(Admins(bot))
