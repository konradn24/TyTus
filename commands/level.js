const Discord = require('discord.js')
const colors = require('../colors.json');

const loading = "Ładowanie...\n";

module.exports.run = async (bot, message, args, database) => {
    var member;

    if(!args[0]) member = message.guild.members.find("id", `${message.author.id}`);
    else member = message.mentions.members.first();

    response(message, loading);

    database.query(`SELECT * FROM servers WHERE discordID = "${message.guild.id}"`, (errC, rowsC) => {
        if(errC) {
            console.log(errC);
            return response(message, ":x: Wystąpił błąd podczas łączenia się z bazą danych (servers - config). Spróbuj ponownie później.");
        }

        if(rowsC.length < 1) return response(message, ":x: Nie możesz zobaczyć swojego poziomu, ponieważ poziomy za aktywność na tym serwerze są wyłączone.");
        
        let config = decode1(rowsC[0].config);

        if(config[2] === "false") return response(message, ":x: Nie możesz zobaczyć swojego poziomu, ponieważ poziomy za aktywność na tym serwerze są wyłączone.");

        database.query(`SELECT * FROM members WHERE discordID = ${member.user.id}`, (err, rows) => {
            if(err) {
                console.log(err);
                return response(message, ":x: Wystąpił błąd podczas łączenia się z bazą danych (1). Spróbuj ponownie później.");
            }

            if(rows.length < 1) return response(message, `\`STAN AKTYWNOŚCI DLA ${member.displayName}\` \n Punkty doświadczenia: **0** / **50** (**0%**) \n Suma całego zdobytego XP: **0** \n Poziom: **1**`);
        
            let xpOnServer = decode1(rows[0].xp);
            let levelOnServer = decode1(rows[0].level);
            let totalXpOnServer = decode1(rows[0].totalXp);

            var thisXp;
            var thisLevel;
            var thisTotalXp;

            for(var i = 0; i < xpOnServer.length; i++) {
                let xpParts = decode2(xpOnServer[i]);
                let levelParts = decode2(levelOnServer[i]);
                let totalXpParts = decode2(totalXpOnServer[i]);

                if(xpParts[0] === message.guild.id) {
                    thisXp = xpParts[1];
                    thisLevel = levelParts[1];
                    thisTotalXp = totalXpParts[1];
                }
            }

            var nextLevel = thisLevel * 50;
            response(message, `\`STAN AKTYWNOŚCI DLA ${member.displayName}\` \n Punkty doświadczenia: **${thisXp}** / **${nextLevel}** (**${Math.floor(thisXp / nextLevel * 100)}%**) \n Suma całego zdobytego XP: **${thisTotalXp}** \n Poziom: **${thisLevel}** \n Miejsce w rankingu: **#${rank}**`);
        });
    });
}

module.exports.config = {
    name: "level",
    aliases: ["myLevel", "points", "myPoints"],
    description: "Pokazuje obecny poziom, ilość punktów za aktywność i pozycję w rankingu na serwerze.",
    bigDesc: "Pokazuje obecny poziom, ilość punktów za aktywność i pozycję w rankingu na serwerze. Jeżeli po **/level** nie będzie określonego użytkownika to zostaną pokazane statystyki dla osoby wywołującej polecenie. Użycie: **/level <@opcjonalnieOsoba>**"
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
