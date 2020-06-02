const Discord = require('discord.js')
const colors = require('../colors.json');

const loading = "Ładowanie...\n";
const adminRole = "713994009944522863";

module.exports.run = async (bot, message, args, database) => {
    let hasRole = message.member.roles.find('id', adminRole);
    if(!hasRole) return response(message, "To polecenie jest dostępne tylko i wyłącznie dla administracji serwera!");

    response(message, loading);

    var id;
    if(args[0]) id = message.mentions.members.first().id;
    else id = message.author.id;

    if(!id) return response(message, `Podany użytkownik nie istnieje!`);

    database.query(`SELECT * FROM administration WHERE discordID="${id}"`, (err, rows) => {
        if(err) {
            console.log(err);
            return response(message, "Wystąpił błąd podczas łączenia się z bazą danych! Spróbuj ponownie później.");
        }

        if(rows.length < 1) {
            if(args[0]) return response(message, `:white_check_mark: Ilość punktów tego użytkownika wynosi: 0`);

            response(message, `:white_check_mark: Twoja ilość punktów wynosi: 0`);
            return database.query(`INSERT INTO administration VALUES(NULL, "${id}", 0)`, console.log);
        }

        if(!args[0]) response(message, `:white_check_mark: Twoja ilość punktów wynosi: ${rows[0].points}`);
        else response(message, `:white_check_mark: Ilość punktów tego użytkownika wynosi: ${rows[0].points}`)
    });
}

module.exports.config = {
    name: "adminPoints",
    aliases: ["ap", "points"],
    description: "Komenda dostępna tylko dla administracji.",
    bigDesc: "Komenda dostępna tylko dla administracji serwera. Pokazuje aktualną ilość punktów za wykonane zadania. Użycie: **/adminPoints <@opcjonalnieOsoba>**."
}

function response(message, response) {
    message.channel.send(response);
}