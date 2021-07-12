import guild_logging
import database


async def add_guild_to_db(guild):
    database.cursor.execute("SELECT guildDiscordID FROM guilds")
    db_guilds_discord_id = database.cursor.fetchall()

    for row in db_guilds_discord_id:
        if row[0] == str(guild.id):
            await guild_logging.notification(f"Dołączono do serwera, który jest już w bazie - {guild.name} ({guild.id})")
            return

    database.cursor.execute("""INSERT INTO guilds(guildDiscordID) VALUES(%s)""", (guild.id,))
    database.connection.commit()
    await guild_logging.notification(f"Dołączono do serwera, dodano go do bazy - {guild.name} ({guild.id})")
