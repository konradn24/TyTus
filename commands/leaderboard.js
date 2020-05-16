const Discord = require('discord.js')
const colors = require('../colors.json');

module.exports.run = async (bot, message, args, database) => {
    database.query(`SELECT * FROM members ORDER BY totalXp DESC`, (err, rows) => {
        if(err) {
            console.log(err);
            return message.channel.send(":x: Wystąpił błąd podczas łączenia się z bazą danych. Spróbuj ponownie później.");
        }

        var text = `\`TOP 10 - AKTYWNOŚĆ\``;
        for(var i = 0; i < 10; i++) {
            text += `\n **#${i + 1}** *${rows[i].username}* | Total XP: **${rows[i].totalXp}** | Poziom: **${rows[i].level}**`;
        }

        message.channel.send(text);
    });
}

module.exports.config = {
    name: "leaderboard",
    aliases: ["ranking", "rank"],
    description: "Wyświetla 10 najaktywniejszych członków serwera.",
    bigDesc: "Wyświetla 10 najaktywniejszych członków serwera."
}