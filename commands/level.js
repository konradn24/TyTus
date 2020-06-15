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
        
            database.query(`SELECT * FROM members WHERE totalXp LIKE "%${message.guild.id}%"`, (err1, rows1) => {
                if(err1) {
                    console.log(err1);
                    return response(message, ":x: Wystąpił błąd podczas łączenia się z bazą danych (2). Spróbuj ponownie później.");
                }

                console.log(rows1.length);

                var xpArray = new Array(rows1.length);
                var levelArray = new Array(rows1.length);
                var totalXpArray = new Array(rows1.length);
                for(var i = 0; i < rows1.length; i++) {
                    let xpServer = decode1(rows1[i].xp);
                    let levelServer = decode1(rows1[i].level);
                    let totalXpServer = decode1(rows1[i].totalXp);
                    for(var j = 0; j < totalXpServer.length; j++) {
                        if(totalXpServer[j].startsWith(message.guild.id)) {
                            xpArray[i] = member.id + ":" + decode2(xpServer[j])[1];
                            levelArray[i] = member.id + ":" + decode2(levelServer[j])[1];
                            totalXpArray[i] = member.id + ":" + decode2(totalXpServer[j])[1];
                        }
                    }
                }

                totalXpArray.sort();

                var rank = totalXpArray.length + 1;
                var thisXp;
                var thisLevel;
                var thisTotalXp;
                for(var i = 0; i < totalXpArray.length; i++) {
                    var id = decode2(totalXpArray[i])[0];
                    var tx = decode2(totalXpArray[i])[1];
                    if(id === member.id) {
                        rank = i + 1;
                        thisTotalXp = tx;

                        for(var j = 0; j < totalXpArray.length; j++) {
                            if(decode2(xpArray[j])[0] === member.id) {
                                thisXp = decode2(xpArray[j])[1];
                                thisLevel = decode2(levelArray[j])[1];
                            }
                        }
                    }
                }

                var nextLevel = thisLevel * 50;
                response(message, `\`STAN AKTYWNOŚCI DLA ${member.displayName}\` \n Punkty doświadczenia: **${thisXp}** / **${nextLevel}** (**${Math.floor(thisXp / nextLevel * 100)}%**) \n Suma wszystkich zdobytych PD: **${thisTotalXp}** \n Poziom: **${thisLevel}** \n Miejsce w rankingu: **#${rank}**`);
            });
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
