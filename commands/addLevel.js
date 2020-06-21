const Discord = require('discord.js')
const colors = require('../colors.json');

const loading = "Dodawanie...\n";

module.exports.run = async (bot, message, args, database) => {
    if(!message.member.hasPermission("ADMINISTRATOR")) return message.channel.send(":x: Nie masz uprawnień do użycia tej komendy (ADMINISTRATOR)!");

    if(!args[0]) return message.channel.send(":x: Określ któremu użytkownikowi chcesz zwiększyć poziom. Jeżeli potrzebujesz pomocy, wprowadź **/help addLevel**.");
    else if(!args[1]) return message.channel.send(":x: Określ ile poziomów chcesz dodać temu użytkownikowi.");
    else if(args[1] < 1) return message.channel.send(":x: Proszę podać liczbę większą od 0! Jeżeli chcesz zmniejszyć poziom użytkownika wprowadź **/reduceLevel <@osoba> <ilosc>**.");
    
    let member = message.mentions.members.first();
    if(!member) return message.channel.send(":x: Określ któremu użytkownikowi chcesz zwiększyć poziom. Jeżeli potrzebujesz pomocy, wprowadź **/help addLevel**.");

    var toAdd = parseInt(args[1]);
    if(isNaN(toAdd)) return message.channel.send(":x: Podana wartość nie jest liczbą!");

    message.channel.send(loading);

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
                return response(message, ":x: Wystąpił błąd podczas łączenia się z bazą danych (1)! Spróbuj ponownie później.");
            }

            var totalXp = 0, lastTotalXp = 0;

            if(rows.length < 1) {
                for(var i = 1; i < toAdd + 1; i++) {
                    totalXp += i * 50;
                }

                database.query(`INSERT INTO members VALUES(NULL, "${member.user.id}", "${member.user.username}", "${message.guild.id}:0", "${message.guild.id}:${toAdd + 1}", "${message.guild.id}:${totalXp}")`);
            
                return response(message, `:white_check_mark: Dodano **${toAdd}** poziomów użytkownikowi **${member.user.username}**. Jego aktualny poziom wynosi ${toAdd + 1}.`);
            }
            
            var xpOnServersText = rows[0].xp;
            var totalXpOnServersText = rows[0].totalXp;
            var levelOnServersText = rows[0].level;
            let xpOnServers = decode1(xpOnServersText);
            let totalXpOnServers = decode1(totalXpOnServersText);
            let levelOnServers = decode1(levelOnServersText);

            var saved = false;
            var xp = 0;
            var level = 1;

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
                }
            });
            
            if(!saved) {
                for(var i = 1; i < toAdd + 1; i++) {
                    totalXp += i * 50;
                }

                xpOnServersText += `${message.guild.id}:0/NF`;
                totalXpOnServersText += `${message.guild.id}:${totalXp}/NF`;
                levelOnServersText += `${message.guild.id}:${toAdd + 1}/NF`;

                database.query(`UPDATE members SET xp = "${xpOnServersText}" WHERE discordID = "${member.user.id}"`);
                database.query(`UPDATE members SET totalXp = "${totalXpOnServersText}" WHERE discordID = "${member.user.id}"`);
                database.query(`UPDATE members SET level = "${levelOnServersText}" WHERE discordID = "${member.user.id}"`);

                return response(message, `:white_check_mark: Dodano **${toAdd}** poziomów użytkownikowi **${member.user.username}**. Jego aktualny poziom wynosi ${toAdd + 1}.`);
            }

            for(var i = level; i < toAdd + level; i++) {
                totalXp += i * 50;
            }

            totalXp -= xp;

            totalXpOnServersText = totalXpOnServersText.replace(`${message.guild.id}:${lastTotalXp}`, `${message.guild.id}:${totalXp}`);
            levelOnServersText = levelOnServersText.replace(`${message.guild.id}:${level}`, `${message.guild.id}:${parseInt(level) + toAdd}`);

            database.query(`UPDATE members SET level = "${levelOnServersText}" WHERE discordID = "${member.user.id}"`);
            database.query(`UPDATE members SET totalXp = "${totalXpOnServersText}" WHERE discordID = "${member.user.id}"`);

            return response(message, `:white_check_mark: Dodano **${toAdd}** poziomów użytkownikowi **${member.user.username}**. Jego aktualny poziom wynosi ${toAdd + 1}.`);
        });
    });
}

module.exports.config = {
    name: "addLevel",
    aliases: ["addPoints", "plusLevel"],
    description: "Dodaje użytkownikowi określoną ilość poziomów.",
    bigDesc: "Dodaje użytkownikowi określoną ilość poziomów. Użycie komendy: **/addLevel <@osoba> <ilosc>**."
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