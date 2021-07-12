import discord
from discord.ext import commands

import database, guild_logging, converters


class Greetings(commands.Cog, name="Powitania i pożegnania"):
    def __init__(self, bot: commands.Bot):
        self.bot = bot

    # ------ EVENTS ------
    @commands.Cog.listener()
    async def on_ready(self):
        print(f"Moduł {__name__} został załadowany")

    @commands.Cog.listener()
    async def on_member_join(self, member):
        database.cursor.execute("SELECT guilds.guildID, guildsWelcomeByeMessages.welcomeChannelID, guildsWelcomeByeMessages.welcomeMessage, guildsWelcomeByeMessages.sendWelcome FROM "
                                "guilds, guildsWelcomeByeMessages WHERE guilds.guildID = guildsWelcomeByeMessages.guildID AND guilds.guildDiscordID = %s", (member.guild.id,))
        guild_greetings = database.cursor.fetchone()
        database.connection.commit()

        if guild_greetings is None:
            await guild_logging.notification(f"Użytkownik {member.name} dołączył do {member.guild.name}. Nie wysłano wiadomości powitalnej - ten serwer nie ma jej zdefiniowanej")
            return

        if guild_greetings[3] == 1:
            channel = self.bot.get_channel(int(guild_greetings[1]))
            if channel is None:
                print(f"Nie można wysłać wiadomości powitalnej - kanał {guild_greetings[1]} nie istnieje! ID serwera w bazie: {guild_greetings[0]}")
                return

            await channel.send(self.format_greeting_message(str(guild_greetings[2]), member))
            await guild_logging.notification(f"Użytkownik {member.name} dołączył do {member.guild.name} ({guild_greetings[0]}). Wysłano wiadomość powitalną")

    @commands.Cog.listener()
    async def on_member_remove(self, member):
        database.cursor.execute("SELECT guilds.guildID, guildsWelcomeByeMessages.byeChannelID, guildsWelcomeByeMessages.byeMessage, guildsWelcomeByeMessages.sendBye FROM "
                                "guilds, guildsWelcomeByeMessages WHERE guilds.guildID = guildsWelcomeByeMessages.guildID AND guilds.guildDiscordID = %s", (member.guild.id,))
        guild_greetings = database.cursor.fetchone()
        database.connection.commit()

        if guild_greetings is None:
            await guild_logging.notification(f"Użytkownik {member.name} opuścił {member.guild.name}. Nie wysłano wiadomości pożegnalnej - ten serwer nie ma jej zdefiniowanej")
            return

        if guild_greetings[3] == 1:
            channel = self.bot.get_channel(int(guild_greetings[1]))
            if channel is None:
                print(f"Nie można wysłać wiadomości pożegnalnej - kanał {guild_greetings[1]} nie istnieje! ID serwera w bazie: {guild_greetings[0]}")
                return

            await channel.send(self.format_greeting_message(str(guild_greetings[2]), member))
            await guild_logging.notification(f"Użytkownik {member.name} opuścił {member.guild.name} ({guild_greetings[0]}). Wysłano wiadomość pożegnalną")

    # ------ COMMANDS: WELCOME ------
    # setWelcome
    @commands.command(name="setWelcome", usage="<kanał> <treść>", description="Ustawia wiadomość powitalną, która jest wysyłana na podanym kanale wtedy, gdy nowy użytkownik pojawi się na serwerze. "
                                                                              "Żeby dodać wzmiankę nowego członka, użyj {user_ping}. {user_name} wstawia nazwę użytkownika, natomiast {count} podaje "
                                                                              "ile aktualnie osób jest na serwerze. "
                                                                              "Przykład: **t!setWelcome #powitania Witaj {user_ping} na serwerze! Jesteś naszym {count} użytkownikiem.**")
    @commands.guild_only()
    @commands.has_guild_permissions(manage_messages=True)
    async def set_welcome(self, ctx: commands.Context, channel: discord.TextChannel, *, msg: str):
        database.cursor.execute("SELECT COUNT(guilds.guildID), guilds.guildID, guildsWelcomeByeMessages.sendWelcome FROM guilds, guildsWelcomeByeMessages "
                                "WHERE guilds.guildID = guildsWelcomeByeMessages.guildID AND guilds.guildDiscordID = %s", (ctx.guild.id,))
        num_rows = database.cursor.fetchall()
        database.connection.commit()

        if num_rows[0][0] <= 0:
            database.cursor.execute("SELECT guildID FROM guilds WHERE guildDiscordID = %s", (ctx.guild.id,))
            guild_id = database.cursor.fetchall()
            database.connection.commit()

            if len(guild_id) <= 0:
                await ctx.send(self.bot.db_guild_not_found_info)
                print(self.bot.db_guild_not_found_console.format(ctx.guild.name, ctx.guild.id))
                return

            database.cursor.execute("INSERT INTO guildsWelcomeByeMessages (guildID, welcomeChannelID, byeChannelID, welcomeMessage, byeMessage, sendWelcome, sendBye) "
                                    "VALUES (%s, %s, 'NULL', %s, 'NULL', 1, 1)", (guild_id[0][0], channel.id, msg,))
            database.connection.commit()

            await ctx.send(f":white_check_mark: Gotowe! Od teraz każdy nowy użytkownik zobaczy na kanale {channel.mention} wiadomość: "
                           f"*{msg.replace('{user_ping}', '@jakiś użytkownik 1234').replace('{user_name}', 'jakiś użytkownik 1234').replace('{count}', str(ctx.guild.member_count))}*")
            await guild_logging.notification(f"Nowa wiadomość powitalna. ID serwera: {num_rows[0][1]}")
        else:
            database.cursor.execute("UPDATE guildsWelcomeByeMessages SET welcomeChannelID = %s, welcomeMessage = %s WHERE guildID = %s",
                                    (channel.id, msg, num_rows[0][1]))
            database.connection.commit()

            if num_rows[0][2] == 1:
                await ctx.send(f":white_check_mark: Gotowe! Od teraz każdy nowy użytkownik zobaczy na kanale {channel.mention} wiadomość: "
                               f"*{msg.replace('{user_ping}', '@jakiś użytkownik 1234').replace('{user_name}', 'jakiś użytkownik 1234').replace('{count}', str(ctx.guild.member_count))}*")
            else:
                await ctx.send(f":white_check_mark: Gotowe! Kanał został ustawiony na {channel.mention}, wiadomość: "
                               f"*{msg.replace('{user_ping}', '@jakiś użytkownik 1234').replace('{user_name}', 'jakiś użytkownik 1234').replace('{count}', str(ctx.guild.member_count))}*"
                               f"\n**Uwaga: jeśli chcesz, żeby wiadomość powitalna była wysyłana, wprowadź t!setWelcomeSend yes**")
                await guild_logging.notification(f"Edycja wiadomości powitalnej (pełna). ID serwera: {num_rows[0][1]}")

    # setWelcomeSend
    @commands.command(name="setWelcomeSend", usage="<yes/no>", description="Określa czy wiadomość powitalna ma być wysyłana (domyślnie ustawione na \"yes\"). Przykład: **t!setWelcomeSend yes**")
    @commands.guild_only()
    @commands.has_guild_permissions(manage_messages=True)
    async def set_welcome_send(self, ctx: commands.Context, send: converters.to_mysql_boolean):
        database.cursor.execute("SELECT COUNT(guilds.guildID), guilds.guildID FROM guilds, guildsWelcomeByeMessages WHERE "
                                "guilds.guildID = guildsWelcomeByeMessages.guildID AND guilds.guildDiscordID = %s", (ctx.guild.id,))
        num_rows = database.cursor.fetchall()
        database.connection.commit()

        if num_rows[0][0] <= 0:
            await ctx.send(":face_with_monocle: Nie masz jeszcze ustawionej żadnej wiadomości powitalnej! Wprowadź **t!setWelcome <kanał> <treść>**")
        else:
            database.cursor.execute("UPDATE guildsWelcomeByeMessages SET sendWelcome = %s WHERE guildID = %s", (send, num_rows[0][1]))
            database.connection.commit()

            if send == 1:
                await ctx.send(":white_check_mark: Od teraz wiadomości powitalne będą wysyłane!")
            else:
                await ctx.send(":white_check_mark: Wysyłanie wiadomości powitalnych zostało wstrzymane!")

            await guild_logging.notification(f"Edycja wiadomości powitalnej (send -> {send}). ID serwera: {num_rows[0][1]}")

    # setWelcomeMessage
    @commands.command(name="setWelcomeMessage", usage="<treść>", description="Ustawia treść wiadomości powitalnej. Przykład: **t!setWelcomeMessage Siema {user_name} :smile:!**")
    @commands.guild_only()
    @commands.has_guild_permissions(manage_messages=True)
    async def set_welcome_message(self, ctx: commands.Context, *, msg: str):
        database.cursor.execute("SELECT COUNT(guilds.guildID), guilds.guildID, guildsWelcomeByeMessages.welcomeMessage FROM guilds, guildsWelcomeByeMessages WHERE "
                                "guilds.guildID = guildsWelcomeByeMessages.guildID AND guilds.guildDiscordID = %s", (ctx.guild.id,))
        num_rows = database.cursor.fetchall()
        database.connection.commit()

        if num_rows[0][0] <= 0:
            await ctx.send(":face_with_monocle: Nie masz jeszcze ustawionej żadnej wiadomości powitalnej! Wprowadź **t!setWelcome <kanał> <treść>**")
        else:
            database.cursor.execute("UPDATE guildsWelcomeByeMessages SET welcomeMessage = %s WHERE guildID = %s", (msg, num_rows[0][1]))
            database.connection.commit()

            await ctx.send(f":white_check_mark: Treść wiadomości powitalnej została zmieniona z *{num_rows[0][2]}* na *{msg}*")
            await guild_logging.notification(f"Edycja wiadomości powitalnej (message). ID serwera: {num_rows[0][1]}")

    # setWelcomeChannel
    @commands.command(name="setWelcomeChannel", usage="<kanał>", description="Ustawia kanał, na który będą wysyłane wiadomości powitalne. Przykład: **t!setWelcomeChannel #nowi**")
    @commands.guild_only()
    @commands.has_guild_permissions(manage_messages=True)
    async def set_welcome_channel(self, ctx: commands.Context, channel: discord.TextChannel):
        database.cursor.execute("SELECT COUNT(guilds.guildID), guilds.guildID, guildsWelcomeByeMessages.welcomeChannelID FROM guilds, guildsWelcomeByeMessages WHERE "
                                "guilds.guildID = guildsWelcomeByeMessages.guildID AND guilds.guildDiscordID = %s", (ctx.guild.id,))
        num_rows = database.cursor.fetchall()
        database.connection.commit()

        if num_rows[0][0] <= 0:
            await ctx.send(":face_with_monocle: Nie masz jeszcze ustawionej żadnej wiadomości powitalnej! Wprowadź **t!setWelcome <kanał> <treść>**")
        else:
            database.cursor.execute("UPDATE guildsWelcomeByeMessages SET welcomeChannelID = %s WHERE guildID = %s", (channel.id, num_rows[0][1]))
            database.connection.commit()

            await ctx.send(f":white_check_mark: Kanał wiadomości powitalnych został zmieniony z "
                           f"*{self.bot.get_channel(int(num_rows[0][2])).mention if self.bot.get_channel(int(num_rows[0][2])) is not None else '???'}* na *{channel.mention}*")
            await guild_logging.notification(f"Edycja wiadomości powitalnej (channel -> {channel.id}). ID serwera: {num_rows[0][1]}")

    # ------ COMMANDS: BYE ------
    # setBye
    @commands.command(name="setBye", usage="<kanał> <treść>", description="Ustawia wiadomość pożegnalną, która jest wysyłana na podanym kanale wtedy, gdy członek opuści serwer. "
                                                                          "{user_name} wstawia nazwę użytkownika, natomiast {count} podaje "
                                                                          "ile aktualnie osób jest na serwerze. Przykład: **t!setBye #pożegnania {user_name} opuścił serwer, pozostało {count} osób "
                                                                          "na pokładzie**")
    @commands.guild_only()
    @commands.has_guild_permissions(manage_messages=True)
    async def set_bye(self, ctx: commands.Context, channel: discord.TextChannel, *, msg: str):
        database.cursor.execute("SELECT COUNT(guilds.guildID), guilds.guildID, guildsWelcomeByeMessages.sendBye FROM guilds, guildsWelcomeByeMessages "
                                "WHERE guilds.guildID = guildsWelcomeByeMessages.guildID AND guilds.guildDiscordID = %s", (ctx.guild.id,))
        num_rows = database.cursor.fetchall()
        database.connection.commit()

        if num_rows[0][0] <= 0:
            database.cursor.execute("SELECT guildID FROM guilds WHERE guildDiscordID = %s", (ctx.guild.id,))
            guild_id = database.cursor.fetchall()
            database.connection.commit()

            if len(guild_id) <= 0:
                await ctx.send(self.bot.db_guild_not_found_info)
                print(self.bot.db_guild_not_found_console.format(ctx.guild.name, ctx.guild.id))
                return

            database.cursor.execute("INSERT INTO guildsWelcomeByeMessages (guildID, welcomeChannelID, byeChannelID, welcomeMessage, byeMessage, sendWelcome, sendBye) "
                                    "VALUES (%s, 'NULL', %s, 'NULL', %s, 1, 1)", (guild_id[0][0], channel.id, msg,))
            database.connection.commit()

            await ctx.send(f":white_check_mark: Gotowe! Od teraz gdy ktoś opuści serwer, na kanale {channel.mention} pojawi się wiadomość: "
                           f"*{msg.replace('{user_ping}', '@jakiś użytkownik 1234').replace('{user_name}', 'jakiś użytkownik 1234').replace('{count}', str(ctx.guild.member_count))}*")
            await guild_logging.notification(f"Nowa wiadomość pożegnalna. ID serwera: {num_rows[0][1]}")
        else:
            database.cursor.execute("UPDATE guildsWelcomeByeMessages SET byeChannelID = %s, byeMessage = %s WHERE guildID = %s",
                                    (channel.id, msg, num_rows[0][1]))
            database.connection.commit()

            if num_rows[0][2] == 1:
                await ctx.send(f":white_check_mark: Gotowe! Od teraz gdy ktoś opuści serwer, na kanale {channel.mention} pojawi się wiadomość: "
                               f"*{msg.replace('{user_ping}', '@jakiś użytkownik 1234').replace('{user_name}', 'jakiś użytkownik 1234').replace('{count}', str(ctx.guild.member_count))}*")
            else:
                await ctx.send(f":white_check_mark: Gotowe! Kanał został ustawiony na {channel.mention}, wiadomość: "
                               f"*{msg.replace('{user_ping}', '@jakiś użytkownik 1234').replace('{user_name}', 'jakiś użytkownik 1234').replace('{count}', str(ctx.guild.member_count))}*"
                               f"\n**Uwaga: jeśli chcesz, żeby wiadomość pożegnalna była wysyłana, wprowadź t!setByeSend yes**")
                await guild_logging.notification(f"Edycja wiadomości pożegnalnej (pełna). ID serwera: {num_rows[0][1]}")

    # setByeSend
    @commands.command(name="setByeSend", usage="<yes/no>", description="Określa czy wiadomość pożegnalna ma być wysyłana (domyślnie ustawione na \"yes\"). Przykład: **t!setByeSend yes**")
    @commands.guild_only()
    @commands.has_guild_permissions(manage_messages=True)
    async def set_bye_send(self, ctx: commands.Context, send: converters.to_mysql_boolean):
        database.cursor.execute("SELECT COUNT(guilds.guildID), guilds.guildID FROM guilds, guildsWelcomeByeMessages WHERE "
                                "guilds.guildID = guildsWelcomeByeMessages.guildID AND guilds.guildDiscordID = %s", (ctx.guild.id,))
        num_rows = database.cursor.fetchall()
        database.connection.commit()

        if num_rows[0][0] <= 0:
            await ctx.send(":face_with_monocle: Nie masz jeszcze ustawionej żadnej wiadomości pożegnalnej! Wprowadź **t!setBye <kanał> <treść>**")
        else:
            database.cursor.execute("UPDATE guildsWelcomeByeMessages SET sendBye = %s WHERE guildID = %s", (send, num_rows[0][1]))
            database.connection.commit()

            if send == 1:
                await ctx.send(":white_check_mark: Od teraz wiadomości pożegnalne będą wysyłane!")
            else:
                await ctx.send(":white_check_mark: Wysyłanie wiadomości pożegnalnych zostało wstrzymane!")

            await guild_logging.notification(f"Edycja wiadomości pożegnalnej (send -> {send}). ID serwera: {num_rows[0][1]}")

    # setByeMessage
    @commands.command(name="setByeMessage", usage="<treść>", description="Ustawia treść wiadomości pożegnalnej. Przykład: **t!setByeMessage Pa {user_name}!**")
    @commands.guild_only()
    @commands.has_guild_permissions(manage_messages=True)
    async def set_bye_message(self, ctx: commands.Context, *, msg: str):
        database.cursor.execute("SELECT COUNT(guilds.guildID), guilds.guildID, guildsWelcomeByeMessages.byeMessage FROM guilds, guildsWelcomeByeMessages WHERE "
                                "guilds.guildID = guildsWelcomeByeMessages.guildID AND guilds.guildDiscordID = %s", (ctx.guild.id,))
        num_rows = database.cursor.fetchall()
        database.connection.commit()

        if num_rows[0][0] <= 0:
            await ctx.send(":face_with_monocle: Nie masz jeszcze ustawionej żadnej wiadomości pożegnalnej! Wprowadź **t!setBye <kanał> <treść>**")
        else:
            database.cursor.execute("UPDATE guildsWelcomeByeMessages SET byeMessage = %s WHERE guildID = %s", (msg, num_rows[0][1]))
            database.connection.commit()

            await ctx.send(f":white_check_mark: Treść wiadomości pożegnalnej została zmieniona z *{num_rows[0][2]}* na *{msg}*")
            await guild_logging.notification(f"Edycja wiadomości pożegnalnej (message). ID serwera: {num_rows[0][1]}")

    # setByeChannel
    @commands.command(name="setByeChannel", usage="<kanał>", description="Ustawia kanał, na który będą wysyłane wiadomości pożegnalne. Przykład: **t!setByeChannel #do-zobaczenia**")
    @commands.guild_only()
    @commands.has_guild_permissions(manage_messages=True)
    async def set_bye_channel(self, ctx: commands.Context, channel: discord.TextChannel):
        database.cursor.execute("SELECT COUNT(guilds.guildID), guilds.guildID, guildsWelcomeByeMessages.byeChannelID FROM guilds, guildsWelcomeByeMessages WHERE "
                                "guilds.guildID = guildsWelcomeByeMessages.guildID AND guilds.guildDiscordID = %s", (ctx.guild.id,))
        num_rows = database.cursor.fetchall()
        database.connection.commit()

        if num_rows[0][0] <= 0:
            await ctx.send(":face_with_monocle: Nie masz jeszcze ustawionej żadnej wiadomości pożegnalnej! Wprowadź **t!setBye <kanał> <treść>**")
        else:
            database.cursor.execute("UPDATE guildsWelcomeByeMessages SET byeChannelID = %s WHERE guildID = %s", (channel.id, num_rows[0][1]))
            database.connection.commit()

            await ctx.send(f":white_check_mark: Kanał wiadomości pożegnalnych został zmieniony z "
                           f"*{self.bot.get_channel(int(num_rows[0][2])).mention if self.bot.get_channel(int(num_rows[0][2])) is not None else '???'}* na *{channel.mention}*")
            await guild_logging.notification(f"Edycja wiadomości pożegnalnej (channel -> {channel.id}). ID serwera: {num_rows[0][1]}")

    # ------ OTHER FUNCTIONS ------
    @staticmethod
    def format_greeting_message(message: str, member):
        # user mention
        # user name
        # member count

        return message.replace('{user_ping}', member.mention).replace('{user_name}', member.name).replace('{count}', str(member.guild.member_count))


def setup(bot):
    bot.add_cog(Greetings(bot))
