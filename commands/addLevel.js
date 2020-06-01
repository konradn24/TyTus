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
    
            var totalXp = 0;
            if(rows.length < 1) {
                for(var i = 1; i < toAdd + 1; i++) {
                    totalXp += i * 50;
                }
    
                database.query(`INSERT INTO members VALUES(NULL, "${member.user.id}", "${member.user.username}", 0, ${toAdd + 1}, ${totalXp})`, (err, rows) => {
                    if(err) {
                        console.log(err);
                        return response(message, ":x: Wystąpił błąd podczas łączenia się z bazą danych (2). Spróbuj ponownie później.");
                    }

                    return response(message, `:white_check_mark: Dodano **${toAdd}** poziomów użytkownikowi **${member.user.username}**. Jego aktualny poziom wynosi ${toAdd + 1}.`);
                });
            }
    
            for(var i = rows[0].level; i < toAdd + rows[0].level; i++) {
                totalXp += i * 50;
            }
    
            totalXp -= rows[0].xp;
            database.query(`UPDATE members SET level = ${rows[0].level + toAdd} WHERE discordID = "${member.user.id}"`, (err1, rows1) => {
                if(err1) {
                    console.log(err1);
                    return response(message, ":x: Wystąpił błąd podczas łączenia się z bazą danych (3). Spróbuj ponownie później.");
                }
    
                database.query(`UPDATE members SET totalXp = ${rows[0].totalXp + totalXp} WHERE discordID = "${member.user.id}"`, (err2, rows2) => {
                    if(err2) {
                        console.log(err2);
                        return response(message, ":x: Wystąpił błąd podczas łączenia się z bazą danych (4). Spróbuj ponownie później.");
                    }

                    return response(message, `:white_check_mark: Dodano **${toAdd}** poziomów użytkownikowi **${member.user.username}**. Jego aktualny poziom wynosi ${rows[0].level + toAdd}.`);
                    });
                });
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