import discord
from discord.ext import commands

import database
import guild_logging


class Miscellaneous(commands.Cog, name="Inne"):
    def __init__(self, bot: commands.Bot):
        self.bot = bot

    @commands.Cog.listener()
    async def on_ready(self):
        print(f"Moduł {__name__} został załadowany")

    @commands.command(usage="", description="Sprawdza czy u bota wszystko w porządku. Jeśli TyTus odpowie - prawdopodobnie wszystko jest okej.")
    async def test(self, ctx: commands.Context):
        await ctx.send(f"Siemka {ctx.author.mention}!")

    @commands.command(name="addServer", usage="", description="Sprawdza czy serwer jest w bazie TyTusa. Jeśli nie, to Twój serwer zostanie do niej dodany (jest to wymagane do użycia większości "
                                                              "poleceń)")
    @commands.guild_only()
    @commands.has_guild_permissions(administrator=True)
    async def add_server(self, ctx: commands.Context):
        database.cursor.execute("SELECT COUNT(guildID), guildID FROM guilds WHERE guildDiscordID = %s", (ctx.guild.id,))
        exists = database.cursor.fetchall()[0]
        database.connection.commit()

        if exists[0] > 0:
            await ctx.send(f":ok_hand: Twój serwer jest już zapisany w bazie danych. Powinieneś mieć możliwość korzystania z większości poleceń, jednak jeśli masz jakiekolwiek kłopoty, wprowadź "
                           f"**t!support**")
            return

        database.cursor.execute("INSERT INTO guilds (guildDiscordID) VALUES (%s)", (ctx.guild.id,))
        database.connection.commit()

        await ctx.send(f":white_check_mark: Twój serwer został zapisany w bazie danych. Powinieneś mieć już możliwość korzystania z większości poleceń, jednak jeśli masz jakiekolwiek kłopoty, "
                       f"wprowadź **t!support**")
        await guild_logging.warning(f"Serwer {ctx.guild.name} ({ctx.guild.id}) został dodany do bazy RĘCZNIE za pomocą polecenia addServer! Należy sprawdzić, czy nie zaistniały żadne problemy na "
                                    f"linii Discord bot - MySQL")
        print(f"Serwer {ctx.guild.name} ({ctx.guild.id}) został dodany do bazy RĘCZNIE za pomocą polecenia addServer! Należy sprawdzić, czy nie zaistniały żadne problemy na "
              f"linii Discord bot - MySQL")


def setup(bot):
    bot.add_cog(Miscellaneous(bot))
