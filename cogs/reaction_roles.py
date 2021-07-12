import discord
from discord.ext import commands

import asyncio
import datetime

import database, guild_logging


class ReactionRoles(commands.Cog, name="Reaction roles"):
    def __init__(self, bot: commands.Bot):
        self.bot = bot

    # ------ EVENTS ------
    @commands.Cog.listener()
    async def on_ready(self):
        print(f"Moduł {__name__} został załadowany")

    @commands.Cog.listener()
    async def on_raw_reaction_add(self, payload):
        # Load RR data
        database.cursor.execute("SELECT COUNT(guildID), guildID, metaID FROM guildsReactionRoles WHERE messageDiscordID = %s", (payload.message_id,))
        reaction_role = database.cursor.fetchall()[0]
        database.connection.commit()

        if reaction_role[0] <= 0:
            return

        emoji = payload.emoji

        # Load & add roles, emojis
        database.cursor.execute("SELECT emojis, roles FROM reactionRolesMeta WHERE metaID = %s", (reaction_role[2],))
        meta = database.cursor.fetchall()[0]
        database.connection.commit()

        emojis = meta[0].split(',')
        roles = meta[1].split(',')

        index = emojis.index(str(emoji))
        guild = self.bot.get_guild(payload.guild_id)
        member = guild.get_member(payload.user_id)
        role = guild.get_role(int(roles[index]))
        await member.add_roles(role)

        await guild_logging.notification(f"Użytkownik {member.name} ({member.id}) otrzymał rolę RR {role.name} ({role.id}) na serwerze {guild.name} ({guild.id})")

    @commands.Cog.listener()
    async def on_raw_reaction_remove(self, payload):
        database.cursor.execute("SELECT COUNT(guildID), guildID, metaID FROM guildsReactionRoles WHERE messageDiscordID = %s", (payload.message_id,))
        reaction_role = database.cursor.fetchall()[0]
        database.connection.commit()

        if reaction_role[0] <= 0:
            return

        emoji = payload.emoji

        database.cursor.execute("SELECT emojis, roles FROM reactionRolesMeta WHERE metaID = %s", (reaction_role[2],))
        meta = database.cursor.fetchall()[0]
        database.connection.commit()

        emojis = meta[0].split(',')
        roles = meta[1].split(',')

        index = emojis.index(str(emoji))
        guild = self.bot.get_guild(payload.guild_id)
        member = guild.get_member(payload.user_id)
        role = guild.get_role(int(roles[index]))
        await member.remove_roles(role)

        await guild_logging.notification(f"Użytkownikowi {member.name} ({member.id}) odebrano rolę RR {role.name} ({role.id}) na serwerze {guild.name} ({guild.id})")

    # ------ COMMANDS ------
    # createRR
    @commands.command(name="createRR", usage="<treść>", description="Tworzy wiadomość typu \"reaction roles\" (kliknij reakcję, żeby otrzymać rolę) na kanale, na którym ta komenda została wywołana. "
                                                                    "Po podaniu treści, należy wysłać dodatkową wiadomość z wypisanymi i oddzielonymi spacjami rolami (przykład: **@rola1 @rola2 "
                                                                    "@rola3**), a następnie zareagować na nią kolejno takimi emoji, które odpowiadają danej roli w kolejności od lewej do prawej (tj."
                                                                    " pierwsza dodana reakcja odpowiada pierwszej wcześniej wypisanej roli, druga reakcja odpowiada drugiej roli, trzecia trzeciej, "
                                                                    "itd.).")
    @commands.guild_only()
    @commands.has_guild_permissions(manage_roles=True)
    async def create_rr(self, ctx: commands.Context, channel: discord.TextChannel, *, text: str):
        # Get guild ID from DB & check if guild is there
        database.cursor.execute("SELECT guildID FROM guilds WHERE guildDiscordID = %s", (ctx.guild.id,))
        guild_id = database.cursor.fetchall()
        database.connection.commit()

        if len(guild_id) <= 0:
            await ctx.send(self.bot.db_guild_not_found_info)
            print(self.bot.db_guild_not_found_console.format(ctx.guild.name, ctx.guild.id))
            return

        guild_id = guild_id[0][0]

        # Await for message with roles & emojis (reactions), assign them to variables
        def check_msg_id(m):
            return m.author == ctx.author

        def check_confirm(m):
            return m.author == ctx.author and m.content in ['ok', 'cancel']

        await ctx.send(":thumbsup: W nowej wiadomości wprowadź role i dodaj kolejno odpowiadające im reakcje. Gdy już to zrobisz, wprowadź **ok**. Jeśi chcesz anulować, wprowadź **cancel**")

        try:
            msg = await self.bot.wait_for('message', check=check_msg_id, timeout=180.0)
            if msg.content == 'cancel':
                await ctx.send(":red_circle: Anulowano!")
                return
        except asyncio.TimeoutError:
            await ctx.send(f":hourglass: {ctx.author.mention}, minął czas oczekiwania na odpowiedź. Spróbuj ponownie, lecz tym razem się pośpiesz!")
            return

        confirm = await self.bot.wait_for('message', check=check_confirm, timeout=180.0)

        if confirm == 'cancel':
            await ctx.send(":red_circle: Anulowano!")
            return

        if len(msg.role_mentions) == 0:
            await ctx.send(":x: We wiadomości nie ma żadnych ról! Jeżeli potrzebujesz pomocy wprowadź **t!support**")
            return

        roles = msg.content # Assign content of message with roles & emojis to variable
        roles = str.replace(roles, '<', '')    # Remove '<'
        roles = str.replace(roles, '>', '')    # Remove '>'
        roles = str.replace(roles, '@', '')    # Remove '@'
        roles = str.replace(roles, '&', '')    # Remove '&'
        roles = str.split(roles, ' ')          # Split by space (' ')
        roles = [x for x in roles if x != '']  # Remove blank characters from roles list

        emojis = msg.reactions

        # Check received roles & emojis
        if len(roles) != len(msg.role_mentions):
            await ctx.send(":x: We wiadomości muszą się znaleźć tylko role, a wygląda na to, że tak nie było! Jeżeli potrzebujesz pomocy wprowadź **t!support**")
            return
        elif len(roles) + len(emojis) == 0:
            await ctx.send(":x: We wiadomości nie ma żadnych ról ani reakcji! Jeżeli potrzebujesz pomocy wprowadź **t!support**")
            return
        elif len(roles) == 0 and len(emojis) > 0:
            await ctx.send(":x: We wiadomości nie ma żadnych ról! Jeżeli potrzebujesz pomocy wprowadź **t!support**")
            return
        elif len(roles) > 0 and len(emojis) == 0:
            await ctx.send(":x: Nie dodano żadnych reakcji do wiadomości z rolami! Jeżeli potrzebujesz pomocy wprowadź **t!support**")
            return
        elif len(roles) != len(emojis):
            await ctx.send(f":x: Ilość reakcji ({len(emojis)}) nie jest równa ilości podanych ról ({len(roles)})! Jeżeli potrzebujesz pomocy wprowadź **t!support**")
            return

        # Prepare roles & emojis for inserting to DB
        roles_text = ""
        for role in roles:
            roles_text = roles_text + role + ','
        roles_text = roles_text[:-1]

        emojis_text = ""
        for emoji in emojis:
            emojis_text = emojis_text + str(emoji.emoji) + ','
        emojis_text = emojis_text[:-1]

        # Send RR embed
        embed = discord.Embed(
            description=text,
            color=discord.Color.blue()
        )

        date = datetime.datetime.now()
        embed.set_footer(text=f"TyTus © {date.year}")

        msg = await channel.send(embed=embed)

        for emoji in emojis:
            await msg.add_reaction(emoji)

        # Save meta data - emojis + roles
        database.cursor.execute("INSERT INTO reactionRolesMeta (emojis, roles) VALUES (%s, %s)", (emojis_text, roles_text))
        database.connection.commit()

        # Get saved data ID
        database.cursor.execute("SELECT metaID FROM reactionRolesMeta ORDER BY metaID DESC LIMIT 1")
        meta_id = database.cursor.fetchall()[0][0]
        database.connection.commit()

        # Save main data
        database.cursor.execute("INSERT INTO guildsReactionRoles (guildID, channelDiscordID, messageDiscordID, metaID) VALUES (%s, %s, %s, %s)", (guild_id, channel.id, msg.id, meta_id))
        database.connection.commit()

        await ctx.send(f":star_struck: Utworzyłem wiadomość *reaction roles* na kanale {channel.mention}. Kliknij w link! {msg.jump_url}")


def setup(bot):
    bot.add_cog(ReactionRoles(bot))
