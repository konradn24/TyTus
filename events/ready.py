import discord
from discord.ext import commands

import guild_logging

import os
import asyncio


async def print_info():
    await guild_logging.notification("Program został zalogowany!")


async def change_presence(bot: commands.Bot):
    await bot.wait_until_ready()

    name_prefix = "t!help ☆ "
    names = [f"Wydanie {os.environ['VERSION']}", f"Liczba serwerów: {len(bot.guilds)}", f"Liczba user'ów: {len(bot.users)}"]

    i = 0
    
    while not bot.is_closed():
        if i >= len(names):
            i = 0

        activity = discord.Activity(type=discord.ActivityType.watching, name=name_prefix + names[i])
        await bot.change_presence(activity=activity)

        await asyncio.sleep(5)
