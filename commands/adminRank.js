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

        if(rowsC.length < 1) return response(message, "Nie określono roli zarządu serwera! Jeżeli chcesz to zmienić, wprowadź **/config adminRole <@rola>**.");

        let config = decode1(rowsC[0].config);
        adminRole = config[10];
        if(adminRole === "N") return response(message, "Nie określono roli zarządu serwera! Jeżeli chcesz to zmienić, wprowadź **/config adminRole <@rola>**.");

        let hasRole = message.member.roles.find('id', adminRole);
        if(!hasRole) return response(message, "To polecenie jest dostępne tylko i wyłącznie dla administracji serwera! Jeżeli należysz do zarządu tego serwera, sprawdź poprawność ustawienia \"adminRole\" poleceniem **/showConfig adminRole**.");

        response(message, loading);

        database.query(`SELECT * FROM administration WHERE points LIKE "%${message.guild.id}%"`, (err, rows) => {
            if(err) {
                console.log(err);
                return response(message, ":x: Wystąpił błąd podczas łączenia się z bazą danych. Spróbuj ponownie później.");
            }

            var points = new Array(rows.length);
            var pointsExt = new Array(rows.length);
            var leaderboard = new Array();

            for(var i = 0; i < rows.length; i++) {
                let decoded = decode1(rows[i].points);

                decoded.forEach(element => {
                    if(element.startsWith(message.guild.id)) {
                        pointsExt[i] = `${rows[i].discordID}:${decode2(element)[1]}`;
                        points[i] = parseInt(decode2(element)[1]);
                    }
                });
            }

            points.sort(function(a,b){return a-b});
            points.reverse();

            for(var i = 0; i < points.length; i++) {
                pointsExt.forEach(element => {
                    if(parseInt(decode2(element)[1]) === points[i]) {
                        if(leaderboard.length < 10 && !leaderboard.find(e => e === element) && message.guild.members.find('id', decode2(element)[0]) != null) leaderboard.push(element);
                    }
                });
            }

            var text = `\`ADMINISTRATORZY - RANKING\``;

            if(leaderboard.length < 1) text += `\nBrak informacji do wyświetlenia!\nPrawdopodobnie wszyscy administratorzy mają 0 punktów.\n**/addTask <@rola/@user> <termin (dni)> <ilość punktów (NIEWYMAGANE)> <treść>** - zadaj zadanie dla administracji\n**/addPoints <@user> <ilość>** - dodaj komuś punkty`;

            for(var i = 0; i < leaderboard.length; i++) {
                var username = message.guild.members.find('id', decode2(leaderboard[i])[0]).user.username;
                text += `\n **#${i + 1}** *${username}* | Punkty: **${decode2(leaderboard[i])[1]}**`;
            }

            response(message, text);
        });
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