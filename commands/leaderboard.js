const Discord = require('discord.js')
const colors = require('../colors.json');

const loading = "Ładowanie...\n";

module.exports.run = async (bot, message, args, database) => {
    response(message, loading);

    database.query(`SELECT * FROM servers WHERE discordID = "${message.guild.id}"`, (errC, rowsC) => {
        if(errC) {
            console.log(errC);
            return response(message, ":x: Wystąpił błąd podczas łączenia się z bazą danych (config). Spróbuj ponownie później.");
        }

        if(rowsC.length < 1) return response(message, ":x: Nie możesz zobaczyć swojego poziomu, ponieważ poziomy za aktywność na tym serwerze są wyłączone.");

        let config = decode1(rowsC[0].config);

        if(config[2] === "false") return response(message, ":x: Nie możesz zobaczyć rankingu aktywności, ponieważ poziomy za aktywność są wyłączone.");

        database.query(`SELECT * FROM members WHERE totalXp LIKE "%${message.guild.id}%"`, (err, rows) => {
            if(err) {
                console.log(err);
                return response(message, ":x: Wystąpił błąd podczas łączenia się z bazą danych. Spróbuj ponownie później.");
            }

            var totals = new Array(rows.length);
            var totalsExt = new Array(rows.length);
            var levelsExt = new Array(rows.length);
            var leaderboard = new Array();

            for(var i = 0; i < rows.length; i++) {
                let decodedLevels = decode1(rows[i].level)
                let decodedXp = decode1(rows[i].totalXp);

                decodedXp.forEach(element => {
                    if(element.startsWith(message.guild.id)) {
                        totalsExt[i] = `${rows[i].discordID}:${decode2(element)[1]}`;
                        totals[i] = parseInt(decode2(element)[1]);
                    }
                });

                decodedLevels.forEach(element => {
                    if(element.startsWith(message.guild.id)) {
                        levelsExt[i] = `${rows[i].discordID}:${decode2(element)[1]}`;
                    }
                });
            }

            totals.sort(function(a,b){return a-b});
            totals.reverse();

            for(var i = 0; i < totals.length; i++) {
                totalsExt.forEach(element => {
                    if(parseInt(decode2(element)[1]) === totals[i]) {
                        if(leaderboard.length < 10 && !leaderboard.find(e => e === element) && message.guild.members.find('id', decode2(element)[0]) != null) leaderboard.push(element);
                    }
                });
            }

            var text = `\`TOP 10 - AKTYWNOŚĆ\``;
            for(var i = 0; i < leaderboard.length; i++) {
                var level;
                for(var j = 0; j < levelsExt.length; j++) {
                    decode2(levelsExt[j]).forEach(element => {
                        if(element.startsWith(decode2(leaderboard[i])[0])) {
                            level = decode2(levelsExt[j])[1];
                        }
                    });
                }

                if(message.guild.members.find('id', decode2(leaderboard[i])[0]) != null)
                    text += `\n **#${i + 1}** *${message.guild.members.find('id', decode2(leaderboard[i])[0]).displayName}* | Total XP: **${decode2(leaderboard[i])[1]}** | Poziom: **${level}**`;
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