const Discord = require('discord.js')
const colors = require('../colors.json');

const loading = "Resetowanie poziomów... Może to potrwać kilka (lub trochę więcej) minut...";

var started = false;

module.exports.run = async (bot, message, args, database) => {
    if(!message.member.hasPermission("ADMINISTRATOR")) return message.channel.send("Nie masz uprawnień do użycia tej komendy (ADMINISTRATOR)!");

    if((!args[0] && !started) || (args[0] === "YES" && !started)) {
        started = true;
        return message.channel.send(":grey_question: Wpisz **/resetLevels YES** jeżeli jesteś pewny, że chcesz to zrobić. Jeżeli nie chcesz, to wprowadź **/resetLevels NO** lub **/resetLevels**. UWAGA: ZRESETOWANIA PUNKTÓW I POZIOMÓW DLA WSZYSTKICH UŻYTKOWNIKÓW PRZEWAŻNIE NIE DA SIĘ COFNĄĆ!!!");
    }

    if((!args[0] && started) || (args[0] === "NO" && started)) {
        started = false;
        return message.channel.send(":x: Anulowano resetowanie punktów i poziomów za aktywność.");
    }

    if(args[0] === "YES" && started) {
        started = false;

        response(message, loading);

        database.query(`SELECT * FROM members WHERE xp LIKE "%${message.guild.id}%"`, (err, rows) => {
            if(err) {
                console.log(err);
                return response(message, ":x: Wystąpił błąd! Spróbuj ponownie później.");
            }

            var count = 0;

            for(var i = 0; i < rows.length; i++) {
                count++;

                var xpOnServersText = rows[i].xp;
                var totalXpOnServersText = rows[i].totalXp;
                var levelOnServersText = rows[i].level;
                let xpOnServers = decode1(xpOnServersText);
                let totalXpOnServers = decode1(totalXpOnServersText);
                let levelOnServers = decode1(levelOnServersText);

                xpOnServers.forEach(element => {
                    if(element.startsWith(message.guild.id)) {
                        xpOnServersText = xpOnServersText.replace(element, `${message.guild.id}:0`);
                    }
                });

                levelOnServers.forEach(element => {
                    if(element.startsWith(message.guild.id)) {
                        levelOnServersText = levelOnServersText.replace(element, `${message.guild.id}:1`);
                    }
                });

                totalXpOnServers.forEach(element => {
                    if(element.startsWith(message.guild.id)) {
                        totalXpOnServersText = totalXpOnServersText.replace(element, `${message.guild.id}:0`);
                    }
                });

                database.query(`UPDATE members SET xp = "${xpOnServersText}" WHERE id = ${rows[i].id}`);
                database.query(`UPDATE members SET level = "${levelOnServersText}" WHERE id = ${rows[i].id}`);
                database.query(`UPDATE members SET totalXp = "${totalXpOnServersText}" WHERE id = ${rows[i].id}`);
            }

            response(message, `:white_check_mark: Pomyślnie zresetowano poziomy dla ${count} użytkowników.`);
        })
    }
}

module.exports.config = {
    name: "resetLevels",
    aliases: ["rLevels", "resetPointsForActivity"],
    description: "Resetuje punkty i poziomy za aktywność dla wszystkich użytkowników zapisanych w bazie danych. __UWAGA: NIE MOŻNA TEGO COFNĄĆ!!!__.",
    bigDesc: "Resetuje punkty i poziomy za aktywność dla wszystkich użytkowników zapisanych w bazie danych. __UWAGA: NIE MOŻNA TEGO COFNĄĆ!!!__."
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