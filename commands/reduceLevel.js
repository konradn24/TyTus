const Discord = require('discord.js')
const colors = require('../colors.json');

const loading = "Zmniejszanie poziomu..."

module.exports.run = async (bot, message, args, database) => {
    if(!message.member.hasPermission("ADMINISTRATOR")) return message.channel.send(":x: Nie masz uprawnień do użycia tej komendy (ADMINISTRATOR)!");

    if(!args[0]) return message.channel.send(":x: Określ któremu użytkownikowi chcesz zmniejszyć poziom. Jeżeli potrzebujesz pomocy, wprowadź **/help reduceLevel**.");
    else if(!args[1]) return message.channel.send(":x: Określ ile poziomów chcesz odjąć temu użytkownikowi.");
    else if(args[1] < 1) return message.channel.send(":x: Proszę podać liczbę większą od 0! Jeżeli chcesz zwiększyć poziom użytkownika wprowadź **/addLevel <@osoba> <ilosc>**.");
    
    let member = message.mentions.members.first();
    if(!member) return message.channel.send(":x: Określ któremu użytkownikowi chcesz zmniejszyć poziom. Jeżeli potrzebujesz pomocy, wprowadź **/help reduceLevel**.");

    var toReduce = parseInt(args[1]);
    if(isNaN(toReduce)) return message.channel.send(":x: Podana wartość nie jest liczbą!");

    response(message, loading);

    database.query(`SELECT * FROM servers WHERE discordID = "${message.guild.id}"`, (errC, rowsC) => {
        if(errC) {
            console.log(errC);
            return response(message, ":x: Wystąpił błąd podczas łączenia się z bazą danych (config). Spróbuj ponownie później.");
        }

        if(rowsC.length < 1) return response(message, ":x: Nie możesz użyć tej komendy, ponieważ poziomy za aktywność są wyłączone. Jeżeli chcesz je włączyć, wprowadź **/config activityLevels true**.");
        
        let config = decode1(rowsC[0].config);

        if(config[2] === "false") return response(message, ":x: Nie możesz użyć tej komendy, ponieważ poziomy za aktywność są wyłączone. Jeżeli chcesz je włączyć, wprowadź **/config activityLevels true**.");

        database.query(`SELECT * FROM members WHERE discordID = "${member.user.id}"`, (err, rows) => {
            if(err) {
                console.log(err);
                return response(message, ":x: Wystąpił błąd podczas łączenia się z bazą danych (1). Spróbuj ponownie później.");
            }

            if(rows.length < 1) return response(message, ":x: Nie można zredukować poziomu tego użytkownika, gdyż ma on poziom **1**.");

            var xpOnServersText = rows[0].xp;
            var totalXpOnServersText = rows[0].totalXp;
            var levelOnServersText = rows[0].level;
            let xpOnServers = decode1(xpOnServersText);
            let totalXpOnServers = decode1(totalXpOnServersText);
            let levelOnServers = decode1(levelOnServersText);

            var saved = false;
            var xp = 0;
            var totalXp = 0, lastTotalXp = 0;
            var level = 1, lastLevel = 1;

            xpOnServers.forEach(element => {
                var elementID = decode2(element)[0];
                var elementValue = decode2(element)[1];
                if(message.guild.id === elementID) {
                    saved = true;
                    xp = parseInt(elementValue);
                }
            });

            totalXpOnServers.forEach(element => {
                var elementID = decode2(element)[0];
                var elementValue = decode2(element)[1];
                if(message.guild.id === elementID) {
                    saved = true;
                    totalXp = parseInt(elementValue);
                    lastTotalXp = parseInt(elementValue);
                }
            });

            levelOnServers.forEach(element => {
                var elementID = decode2(element)[0];
                var elementValue = decode2(element)[1];
                if(message.guild.id === elementID) {
                    saved = true;
                    level = parseInt(elementValue);
                    lastLevel = parseInt(elementValue);
                }
            });

            if(level < 2) return response(message, ":x: Nie można zredukować poziomu tego użytkownika, gdyż ma on poziom **1**.");
            if(toReduce > level - 1) return response(message, `:x: Podałeś zbyt dużą wartość. Po zmianie poziom użytkownika wyniósłby 0 lub liczbę poniżej 0. Jego obecny poziom wynosi **${level}**, więc możesz go zmniejszyć maksymalnie o **${level - 1}**.`);
            if(!saved) return response(message, ":x: Nie można zredukować poziomu tego użytkownika, gdyż ma on poziom **1**.");

            totalXp = 0;
            for(var i = lastLevel - toReduce; i < lastLevel; i++) {
                totalXp += i * 50;
            }

            xpOnServersText = xpOnServersText.replace(`${message.guild.id}:${xp}`, `${message.guild.id}:0`);
            levelOnServersText = levelOnServersText.replace(`${message.guild.id}:${lastLevel}`, `${message.guild.id}:${lastLevel - toReduce}`);
            totalXpOnServersText = totalXpOnServersText.replace(`${message.guild.id}:${lastTotalXp}`, `${message.guild.id}:${lastTotalXp - totalXp}`);

            database.query(`UPDATE members SET xp = "${xpOnServersText}" WHERE discordID = "${member.user.id}"`);
            database.query(`UPDATE members SET level = "${levelOnServersText}" WHERE discordID = "${member.user.id}"`);
            database.query(`UPDATE members SET totalXp = "${totalXpOnServersText}" WHERE discordID = "${member.user.id}"`);

            response(message, `:white_check_mark: Odjęto **${toReduce}** poziomów użytkownikowi **${member.user.username}**. Jego aktualny poziom wynosi ${lastLevel - toReduce}.`);
        });
    });
}

module.exports.config = {
    name: "reduceLevel",
    aliases: ["minusLevel", "removeLevel"],
    description: "Odejmuje podaną ilość poziomów danemu użytkownikowi.",
    bigDesc: "Odejmuje podaną ilość poziomów danemu użytkownikowi."
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