const Discord = require('discord.js')
const colors = require('../colors.json');

const loading = "Dodawanie...\n";

const adminRole = "713994009944522863";

module.exports.run = async (bot, message, args, database) => {
    if(message.author.id != message.guild.owner.id) return response(message, ":x: Nie możesz użyć tego polecenia!");

    if(!args[0]) return response(message, ":x: Określ komu chcesz dodać punkty!");
    else if(!args[1]) return response(message, ":x: Podaj ile punktów chcesz przyznać temu użytkownikowi!");
    else if(isNaN(parseInt(args[1]))) return response(message, ":x: Podana wartość nie jest liczbą!");
    else if(parseInt(args[1]) < 1) return response(message, ":x: Liczba musi być większa od 0! Jeżeli chesz odjąć punkty, wprowadź **/reducePoints <@osoba> <ilosc>**.");

    response(message, loading);

    var admin = message.mentions.members.first();
    if(!admin) return response(message, ":x: Podany użytkownik nie istnieje!");

    var toAdd = parseInt(args[1]);

    database.query(`SELECT * FROM administration WHERE discordID="${admin.id}"`, (err, rows) => {
        if(err) {
            console.log(err);
            return response(message, "Wystąpił błąd (1)!");
        }

        if(rows.length < 1) {
            database.query(`SELECT * FROM servers WHERE discordID = "${message.guild.id}"`, (errC, rowsC) => {
                if(errC) {
                    console.log(errC);
                    return response(message, ":x: Wystąpił błąd (config)! Spróbuj ponownie później.");
                }

                var adminRole;

                if(rowsC.length < 1) return response(":x: Nie określono roli zarządu serwera! Jeżeli chcesz to zmienić, wprowadź **/config adminRole <@rola>**.");

                let config = decode1(rowsC[0].config);
                adminRole = config[10];

                if(admin.roles.find('id', adminRole)) {
                    database.query(`INSERT INTO administration VALUES(NULL, "${admin.id}", "${message.guild.id}:${toAdd}/NF")`, console.log);
                    return response(message, `:white_check_mark: Dodano użytkownikowi **${admin.user.username}** **${toAdd}** punktów! Ma on już w sumie ${toAdd} punktów.`);
                } else {
                    return response(message, ":x: Podany użytkownik nie należy do zarządu serwera!");
                }
            });
        } else {
            var pointsOnServersText = rows[0].points;
            let pointsOnServers = decode1(pointsOnServersText);

            var points = -1;

            pointsOnServers.forEach(element => {
                if(element.startsWith(message.guild.id)) {
                    points = parseInt(decode2(element)[1]);
                }
            });

            if(points === -1) {
                pointsOnServersText += `${message.guild.id}:${toAdd}/NF`;
            } else {
                pointsOnServersText = pointsOnServersText.replace(`${message.guild.id}:${points}`, `${message.guild.id}:${points + toAdd}`);
            }

            database.query(`UPDATE administration SET points="${pointsOnServersText}" WHERE discordID="${admin.id}"`);
            response(message, `:white_check_mark: Dodano użytkownikowi **${admin.user.username}** **${toAdd}** punktów! Ma on już w sumie ${points + toAdd} punktów.`);
        }
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