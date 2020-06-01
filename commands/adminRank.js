const Discord = require('discord.js')
const colors = require('../colors.json');

const loading = "Ładowanie...\n";
const adminRole = "713994009944522863";

module.exports.run = async (bot, message, args, database) => {
    let hasRole = message.member.roles.find('id', adminRole);
    if(!hasRole) return response(message, "To polecenie jest dostępne tylko i wyłącznie dla administracji serwera!");

    response(message, loading);

    database.query(`SELECT * FROM administration ORDER BY points DESC`, (err, rows) => {
        if(err) {
            console.log(err);
            return response(message, ":x: Wystąpił błąd podczas łączenia się z bazą danych. Spróbuj ponownie później.");
        }

        var text = `\`ADMINISTRATORZY - RANKING\``;
        for(var i = 0; i < rows.length; i++) {
            var username = message.guild.members.find('id', rows[i].discordID).user.username;
            text += `\n **#${i + 1}** *${username}* | Punkty: **${rows[i].points}**`;
        }

        response(message, text);
    });
}

module.exports.config = {
    name: "adminRank",
    aliases: ["ar", "rank"],
    description: "Komenda dostępna tylko dla administracji.",
    bigDesc: "Komenda dostępna tylko dla administracji serwera. Pokazuje ranking administratorów."
}

function response(message, response) {
    message.channel.send(response);
}