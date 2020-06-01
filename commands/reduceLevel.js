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

    database.query(`SELECT * FROM config WHERE id = 3`, (errC, rowsC) => {
        if(errC) {
            console.log(errC);
            return response(message, ":x: Wystąpił błąd podczas łączenia się z bazą danych (config). Spróbuj ponownie później.");
        }

        if(rowsC[0].value === "false") return response(message, ":x: Nie możesz użyć tej komendy, ponieważ poziomy za aktywność są wyłączone. Jeżeli chcesz je włączyć, wprowadź **/config activityLevels true**.");

        database.query(`SELECT * FROM members WHERE discordID = "${member.user.id}"`, (err, rows) => {
            if(err) {
                console.log(err);
                return response(message, ":x: Wystąpił błąd podczas łączenia się z bazą danych (1). Spróbuj ponownie później.");
            }

            if(rows.length < 1) return response(message, ":x: Nie można zredukować poziomu tego użytkownika, gdyż ma on poziom **1**.");
            else if(rows[0].level < 2) return response(message, ":x: Nie można zredukować poziomu tego użytkownika, gdyż ma on poziom **1**.");
            else if(toReduce > rows[0].level - 1) return response(message, `:x: Podałeś zbyt dużą wartość. Po zmianie poziom użytkownika wyniósłby 0 lub liczbę poniżej 0. Jego obecny poziom wynosi **${rows[0].level}**, więc możesz go zmniejszyć maksymalnie o **${rows[0].level - 1}**.`);

            var lastLevel = rows[0].level;
            var lastTotalXp = rows[0].totalXp;

            database.query(`UPDATE members SET level = ${rows[0].level - toReduce} WHERE discordID = "${member.user.id}"`, (err1, rows1) => {
                if(err1) {
                    console.log(err1);
                    return response(message, ":x: Wystąpił błąd podczas łączenia się z bazą danych (2). Spróbuj ponownie później.");
                }

                database.query(`UPDATE members SET xp = 0 WHERE discordID = "${member.user.id}"`, (err2, rows2) => {
                    if(err2) {
                        console.log(err2);
                        return response(message, ":x: Wystąpił błąd podczas łączenia się z bazą danych (3). Spróbuj ponownie później.");
                    }

                    var totalXp = 0;
                    for(var i = lastLevel - toReduce; i < lastLevel; i++) {
                        totalXp += i * 50;
                    }

                    database.query(`UPDATE members SET totalXp = ${lastTotalXp - totalXp} WHERE discordID = "${member.user.id}"`, (err3, rows3) => {
                        if(err3) {
                            console.log(err3);
                            return response(message, ":x: Wystąpił błąd podczas łączenia się z bazą danych (4). Spróbuj ponownie później.");
                        }

                        response(message, `:white_check_mark: Odjęto **${toReduce}** poziomów użytkownikowi **${member.user.username}**. Jego aktualny poziom wynosi ${lastLevel - toReduce}.`);
                    });
                });
            });
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