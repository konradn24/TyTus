import discord
from discord.ext import commands

import guild_logging, database


async def print_info():
    await guild_logging.notification("Program został zalogowany!")
