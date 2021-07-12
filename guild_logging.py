bot = None

notification_channel = 774763549817962507
warning_channel = 774763577269551114
error_channel = 774763601457446963


async def notification(msg):
    if bot is None:
        print("Nie można wysłać loga! Przypisz obiekt bota do zmiennej 'bot'!")

    await bot.get_channel(notification_channel).send(msg)


async def warning(msg):
    if bot is None:
        print("Nie można wysłać loga! Przypisz obiekt bota do zmiennej 'bot'!")

    await bot.get_channel(warning_channel).send(msg)


async def error(msg):
    if bot is None:
        print("Nie można wysłać loga! Przypisz obiekt bota do zmiennej 'bot'!")

    await bot.get_channel(error_channel).send(msg)
