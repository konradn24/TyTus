const Discord = require('discord.js')
const colors = require('../colors.json');

const loading = "Odejmowanie...\n";

const adminRole = "713994009944522863";
const titiID = "334361003498405889";

module.exports.run = async (bot, message, args, database) => {
    if(message.author.id != titiID) return response(message, "Nie możesz użyć tego polecenia!");

    if(!args[0]) return response(message, "Określ komu chcesz odjąć punkty!");
    else if(!args[1]) return response(message, "Podaj ile punktów chcesz odjąć temu użytkownikowi!");
    else if(isNaN(parseInt(args[1]))) return response(message, "Podana wartość nie jest liczbą!");
    else if(parseInt(args[1]) < 1) return response(message, "Liczba musi być większa od 0! Jeżeli chesz dodać punkty, wprowadź **/addPoints <@osoba> <ilosc>**.");

    response(message, loading);

    var admin = message.mentions.members.first();
    if(!admin) return response(message, "Podany użytkownik nie istnieje!");

    var toReduce = parseInt(args[1]);

    database.query(`SELECT * FROM administration WHERE discordID="${admin.id}"`, (err, rows) => {
        if(err) {
            console.log(err);
            return response(message, "Wystąpił błąd (1)!");
        }

        var current = -1;

        if(rows.length < 1) {
            if(admin.roles.find('id', adminRole)) {
                current = 0;
            } else {
                return response(message, "Podany użytkownik nie należy do zarządu serwera!");
            }
        }

        if(current < 1) {
            if(current === 0) {
                return response(message, "Ten użytkownik ma aktualnie **0** punktów, więc nie możesz mu nic odjąć!");
            } else {
                current = rows[0].points;
                
                if(current - toReduce < 0) return response(message, `Ten użytkownik ma aktualnie ${current} punktów, więc nie możesz odjąć mu ${toReduce} punktów!`);
            }
        }

        database.query(`UPDATE administration SET points=${rows[0].points - toReduce} WHERE discordID="${admin.id}"`);
        response(message, `:white_check_mark: Odjęto użytkownikowi **${admin.user.username}** **${toReduce}** punktów! Ma on teraz ${rows[0].points - toReduce} punktów.`);
    });    
}

module.exports.config = {
    name: "reducePoints",
    aliases: ["rp", "reduceP", "rPoints", "minusPoints"],
    description: "Redukuje punkty określonemu członkowi zarządu serwera. Dostępne tylko dla właściciela serwera.",
    bigDesc: "Redukuje punkty określonemu członkowi zarządu serwera. Dostępne tylko dla właściciela serwera. Użycie: **/reducePoints <@osoba> <ilosc>**."
}

function response(message, response) {
    message.channel.send(response);
}