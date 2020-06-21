const Discord = require('discord.js')
const colors = require('../colors.json');

const loading = "Ładowanie...\n";

module.exports.run = async (bot, message, args, database) => {
    database.query(`SELECT * FROM servers WHERE discordID = "${message.guild.id}"`, (errC, rowsC) => {
        if(errC) {
            console.log(errC);
            return response(message, "Wystąpił błąd (config)! Spróbuj ponownie później.");
        }

        var adminRole;

        if(rowsC.length < 1) return response(":x: Nie określono roli zarządu serwera! Jeżeli chcesz to zmienić, wprowadź **/config adminRole <@rola>**.");

        let config = decode1(rowsC[0].config);
        adminRole = config[10];
        if(adminRole === "N") return response(":x: Nie określono roli zarządu serwera! Jeżeli chcesz to zmienić, wprowadź **/config adminRole <@rola>**.");

        let hasRole = message.member.roles.find('id', adminRole);
        if(!hasRole) return response(message, ":x: To polecenie jest dostępne tylko i wyłącznie dla administracji serwera! Jeżeli należysz do zarządu tego serwera, sprawdź poprawność ustawienia \"adminRole\" poleceniem **/showConfig adminRole**.");

        response(message, loading);

        var id;
        if(args[0]) id = message.mentions.members.first().id;
        else id = message.author.id;

        if(!id) return response(message, `:x: Podany użytkownik nie istnieje!`);

        database.query(`SELECT * FROM administration WHERE discordID="${id}"`, (err, rows) => {
            if(err) {
                console.log(err);
                return response(message, ":x: Wystąpił błąd podczas łączenia się z bazą danych (1)! Spróbuj ponownie później.");
            }

            if(rows.length < 1) {
                if(args[0]) return response(message, `:white_check_mark: Ilość punktów tego użytkownika wynosi: 0`);

                response(message, `:white_check_mark: Twoja ilość punktów wynosi: 0`);
                return database.query(`INSERT INTO administration VALUES(NULL, "${id}", "${message.guild.id}:0/NF")`, console.log);
            }

            var pointsOnServersText = rows[0].points;
            let pointsOnServers = decode1(pointsOnServersText);
            var points = 0;

            pointsOnServers.forEach(element => {
                if(element.startsWith(message.guild.id)) {
                    points = decode2(element)[1];
                }
            });

            if(!args[0]) response(message, `:white_check_mark: Twoja ilość punktów wynosi: ${points}`);
            else response(message, `:white_check_mark: Ilość punktów tego użytkownika wynosi: ${points}`)
        });
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

function decode1(text) {
    let fields = text.split("/NF");

    return fields;
}

function decode2(field) {
    let parts = field.split(":");

    return parts;
}

function decode3(part) {
    let details = part.split(",");

    return details;
}