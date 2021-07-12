import mysql.connector

import guild_logging

import os

connection = mysql.connector.connect(
    host=os.environ['DB_HOST'],
    user=os.environ['DB_USER'],
    password=os.environ['DB_PASS'],
    database=os.environ['DB_NAME']
)

cursor = connection.cursor(buffered=True)
cursor.execute("SET NAMES utf8mb4")
connection.commit()

print(f"Połączono z bazą MySQL")


async def add_admin(guild_id: int, user_discord_id: int, can_create_task: int, points: int = 0, made_tasks: int = 0, failed_tasks: int = 0, warns: int = 0):
    # Inserting user record into admin's table
    cursor.execute("INSERT INTO guildsAdmins (guildID, userDiscordID, canCreateTask) VALUES (%s, %s, %s)", (guild_id, user_discord_id, can_create_task))
    connection.commit()

    # Get inserted user's ID
    cursor.execute("SELECT adminID FROM guildsAdmins ORDER BY adminID DESC LIMIT 1")
    admin_id = cursor.fetchall()[0][0]
    connection.commit()

    # Inserting user's statistics into admin's stats table
    cursor.execute("INSERT INTO adminsStats (adminID, points, madeTasks, failedTasks, warns) VALUES (%s, %s, %s, %s, %s)", (admin_id, points, made_tasks, failed_tasks, warns))
    connection.commit()

    await guild_logging.notification(f"Dodano admina (ID serwera {guild_id}; ID admina {admin_id})")
    print(f"Dodano admina (ID serwera {guild_id}; ID admina {admin_id})")
