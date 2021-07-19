# discord
import discord
from discord.ext import commands

# important modules
import database
import guild_logging
from webserver import keep_alive

# events
from events import events_handler

import os

bot = commands.Bot(command_prefix=['T!', 't!'], intents=discord.Intents.all(), help_command=None)
guild_logging.bot = bot

bot.db_guild_not_found_info = ":thinking: Nie mogę wykonać tego polecenia, gdyż nie znalazłem tego serwera w swojej bazie danych... Wprowadź **t!addServer** lub poproś o pomoc: **t!support**"
bot.db_guild_not_found_console = "Serwer {} ({}) nie został odnaleziony w tabeli 'guilds'"

bot.pdat_guild_invite = "https://discord.gg/UNC5hdxA5F"


@bot.event
async def on_ready():
    await events_handler.ready.print_info()

    bot.loop.create_task(events_handler.ready.change_presence(bot))


@bot.event
async def on_guild_join(guild):
    await events_handler.guild_join.add_guild_to_db(guild)


@bot.event
async def on_command_error(ctx, error):
    await events_handler.command_error.reply(ctx, error)

extensions = [
    'cogs.help',
    'cogs.greetings',
    'cogs.reaction_roles',
    'cogs.admins',
    'cogs.miscellaneous'
]

if __name__ == '__main__':
    for extension in extensions:
        bot.load_extension(extension)

keep_alive()
bot.run(os.environ['TOKEN'])
