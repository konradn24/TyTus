const Discord = require('discord.js')
const colors = require('../colors.json');

const loading = "Dodawanie...\n";

const adminRole = "713994009944522863";
const titiID = "334361003498405889";

module.exports.run = async (bot, message, args, database) => {
    if(message.author.id != titiID) return response(message, "Nie możesz użyć tego polecenia!");

    if(!args[0]) return response(message, "Określ komu chcesz dodać punkty!");
    else if(!args[1]) return response(message, "Podaj ile punktów chcesz przyznać temu użytkownikowi!");
    else if(isNaN(parseInt(args[1]))) return response(message, "Podana wartość nie jest liczbą!");
    else if(parseInt(args[1]) < 1) return response(message, "Liczba musi być większa od 0! Jeżeli chesz odjąć punkty, wprowadź **/reducePoints <@osoba> <ilosc>**.");

    response(message, loading);

    var admin = message.mentions.members.first();
    if(!admin) return response(message, "Podany użytkownik nie istnieje!");

    var toAdd = parseInt(args[1]);

    database.query(`SELECT * FROM administration WHERE discordID="${admin.id}"`, (err, rows) => {
        if(err) {
            console.log(err);
            return response(message, "Wystąpił błąd (1)!");
        }

        if(rows.length < 1) {
            if(admin.roles.find('id', adminRole)) {
                database.query(`INSERT INTO administration VALUES(NULL, "${admin.id}", ${toAdd})`, console.log);
                return response(message, `:white_check_mark: Dodano użytkownikowi **${admin.user.username}** **${toAdd}** punktów! Ma on już w sumie ${toAdd} punktów.`);
            } else {
                return response(message, "Podany użytkownik nie należy do zarządu serwera!");
            }
        }

        database.query(`UPDATE administration SET points=${rows[0].points + toAdd} WHERE discordID="${admin.id}"`);
        response(message, `:white_check_mark: Dodano użytkownikowi **${admin.user.username}** **${toAdd}** punktów! Ma on już w sumie ${rows[0].points + toAdd} punktów.`);
    });
}

module.exports.config = {
    name: "addPoints",
    aliases: ["adp", "plusPoints"],
    description: "Dodaje punkty określonemu członkowi zarządu. Dostępne tylko dla właściciela serwera.",
    bigDesc: "Dodaje punkty określonemu członkowi zarządu. Dostępne tylko dla właściciela serwera. Użycie: **/addPoints <@osoba> <ilosc>**"
}

function response(message, response) {
    message.channel.send(response);
}