import discord
from discord.ext import commands

import guild_logging


async def reply(ctx, error):
    if isinstance(error, commands.MissingRequiredArgument):
        await ctx.send(f":robot: Nie podano wymaganych argumentów! Użycie: **{ctx.command.usage}**")
    elif isinstance(error, (commands.BadArgument, commands.ChannelNotFound)):
        await ctx.send(f":no_entry_sign: Podano niepoprawne argumenty! Użycie: **{ctx.command.usage}**")
    elif isinstance(error, commands.MissingPermissions):
        await ctx.send(f":lock: Nie masz uprawnień do użycia tego polecenia!")
    elif isinstance(error, commands.MissingRole):
        await ctx.send(f":lock: Nie masz roli potrzebnej do użycia tego polecenia!")
    elif isinstance(error, commands.BotMissingPermissions):
        await ctx.send(f":key: Nie mam uprawnień, żeby wykonać to polecenie! Spróbuj przenieść moją rolę ponad wszystkie inne lub dodaj mnie na serwer jeszcze raz.")
    elif isinstance(error, commands.NoPrivateMessage):
        await ctx.send(f":speech_left: To polecenie jest przeznaczone tylko dla serwerów!")
    else:
        await ctx.send(f":x: Wystąpił błąd! Spróbuj ponownie później lub zgłoś problem (za co będziemy bardzo wdzięczni :smile: ): **t!support**")
        await guild_logging.error(f"Podczas wykonywania polecenia {ctx.command.name} na serwerze {ctx.guild.id} wystąpił błąd. Raport błędu: {error}")
        print(f"Podczas wykonywania polecenia {ctx.command.name} na serwerze {ctx.guild.id} wystąpił błąd. Raport błędu: {error}")
