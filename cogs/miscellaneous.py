import discord
from discord.ext import commands


class Miscellaneous(commands.Cog, name="Inne"):
    def __init__(self, bot: commands.Bot):
        self.bot = bot

    @commands.Cog.listener()
    async def on_ready(self):
        print(f"Moduł {__name__} został załadowany")

    @commands.command(usage="", description="Sprawdza czy u bota wszystko w porządku. Jeśli TyTus odpowie - prawdopodobnie wszystko jest okej.")
    async def test(self, ctx: commands.Context):
        await ctx.send(f"Siemka {ctx.author.mention}!")


def setup(bot):
    bot.add_cog(Miscellaneous(bot))
