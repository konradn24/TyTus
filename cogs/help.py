import discord
from discord.ext import commands

import datetime


class Help(commands.Cog, name="Pomocne komendy"):
    def __init__(self, bot: commands.Bot):
        self.bot = bot

    @commands.Cog.listener()
    async def on_ready(self):
        print(f"Moduł {__name__} został załadowany")

    @commands.command(usage="[nazwa polecenia]", description="Wyświetla wszystkie dostępne polecenia. Po podaniu konkretnej nazwy komendy, pokazuje jej szczegóły.")
    async def help(self, ctx: commands.Context, command: str = None):
        if command is not None:
            await self.help_command(ctx, command)
            return

        cogs = self.bot.cogs

        # Create & send embed
        embed = discord.Embed(
            title=f"**TyTus na ratunek**",
            description=f"Wprowadź **t!help <nazwa polecenia>**, aby zobaczyć szczegółowy opis komendy",
            color=discord.Color.random()
        )

        for cog_name in cogs:
            commands_name = ""
            for command in self.bot.get_cog(cog_name).walk_commands():
                commands_name = commands_name + command.name + "\n"

            embed.add_field(name=cog_name, value=commands_name, inline=True)

        date = datetime.datetime.now()
        embed.set_footer(text=f"TyTus © {date.year}")

        await ctx.send(embed=embed)

    @commands.command(usage="", description="Wysyła zaproszenie na serwer, gdzie chętnie Ci pomożemy!")
    async def support(self, ctx: commands.Context):
        await ctx.send(f"Potrzebujesz pomocy lub masz jakiekolwiek wątpliwości? Śmiało poproś nas o pomoc! Zapraszamy: {self.bot.pdat_guild_invite}")

    async def help_command(self, ctx: commands.Context, command: str):
        command = self.bot.get_command(command)

        if command is None:
            await ctx.send(f":thinking: Nie znalazłem polecenia o takiej nazwie! Wprowadź **t!help**, żeby zobaczyć wszystkie dostępne komendy.")
            return

        # Create & send embed
        embed = discord.Embed(
            title=f"**TyTus na ratunek**",
            description=f"Opis polecenia **{command.name}**",
            color=discord.Color.random()
        )

        embed.add_field(name="Użycie", value=f"t!{command.name} {command.usage}", inline=True)
        embed.add_field(name="Opis", value=command.description, inline=True)

        date = datetime.datetime.now()
        embed.set_footer(text=f"TyTus © {date.year}")

        await ctx.send(embed=embed)


def setup(bot):
    bot.add_cog(Help(bot))
