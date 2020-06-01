const Discord = require('discord.js')
const colors = require('../colors.json');

const loading = "Ładowanie...\n";

module.exports.run = async (bot, message, args, database) => {
    response(message, loading);

    database.query(`SELECT * FROM config WHERE id = 3`, (errC, rowsC) => {
        if(errC) {
            console.log(errC);
            return response(message, ":x: Wystąpił błąd podczas łączenia się z bazą danych (config). Spróbuj ponownie później.");
        }

        if(rowsC[0].value === "false") return response(message, ":x: Nie możesz zobaczyć rankingu aktywności, ponieważ poziomy za aktywność są wyłączone.");

        database.query(`SELECT * FROM members ORDER BY totalXp DESC`, (err, rows) => {
            if(err) {
                console.log(err);
                return response(message, ":x: Wystąpił błąd podczas łączenia się z bazą danych. Spróbuj ponownie później.");
            }

            var text = `\`TOP 10 - AKTYWNOŚĆ\``;
            for(var i = 0; i < 10; i++) {
                text += `\n **#${i + 1}** *${rows[i].username}* | Total XP: **${rows[i].totalXp}** | Poziom: **${rows[i].level}**`;
            }

            response(message, text);
        });
    });
}

module.exports.config = {
    name: "leaderboard",
    aliases: ["ranking", "rank"],
    description: "Wyświetla 10 najaktywniejszych członków serwera.",
    bigDesc: "Wyświetla 10 najaktywniejszych członków serwera."
}

function response(message, response) {
    message.channel.send(response);
}