import discord
from discord.ext import commands


def to_mysql_boolean(argument: str):
    argument = argument.lower()

    if argument in ['yes', 'true']:
        return 1
    elif argument in ['no', 'false']:
        return 0
    else:
        raise commands.BadArgument


def user_or_role(argument):
    if argument[2] == '&':
        return [argument[3:-1], 'role']
    elif argument[2] == '!':
        return [argument[3:-1], 'user']
    else:
        raise commands.BadArgument
