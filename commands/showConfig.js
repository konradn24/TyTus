const Discord = require('discord.js')
const colors = require('../colors.json');

const loading = "Ładowanie...";

module.exports.run = async (bot, message, args, database) => {
    if(!args[0]) return message.channel.send(":x: Podaj nazwę opcji, którą chcesz zobaczyć! Jeżeli potrzebujesz pełnej listy dostępnych ustawień, zajrzyj tutaj: **/help configs**.");

    response(message, loading);

    database.query(`SELECT * FROM config WHERE name = "${args[0]}"`, (err, rows) => {
        if(err) {
            console.log(err);
            response(message, ":x: Wystąpił błąd podczas odczytywania informacji z bazy danych (1)! Spróbuj ponownie później.");
        } else {
            if(rows.length < 1) return message.channel.send(":x: Opcja o podanej nazwie nie istnieje! Jeżeli potrzebujesz pełnej listy dostępnych ustawień, zajrzyj tutaj: **/help configs**.");

            var isChannel = false;
            if(rows[0].allowedValues === "channel") isChannel = true;

            database.query(`SELECT * FROM servers WHERE discordID = "${message.guild.id}"`, (err1, rows1) => {
                if(err1) {
                    console.log(err1);
                    return response(message, ":x: Wystąpił błąd podczas odczytywania informacji z bazy danych (2)! Spróbuj ponownie później.");
                }

                if(rows1.length < 1) return response(message, `:white_check_mark: Opcja *${args[0]}* jest obecnie ustawiona na: *${rows[0].value}*`);

                let config = decode1(rows1[0].config);
                var configID = rows[0].id - 1;

                if(isChannel) {
                    var channel = message.guild.channels.find('id', config[configID]);
                    return response(message, `:white_check_mark: Opcja *${args[0]}* jest obecnie ustawiona na: *${channel}*`)
                }

                response(message, `:white_check_mark: Opcja *${args[0]}* jest obecnie ustawiona na: *${config[configID]}*`);
            });
        }
    });
}

module.exports.config = {
    name: "showConfig",
    aliases: ["value", "valueOf", "showValue"],
    description: "Pokazuje na co ustawiona jest podana opcja.",
    bigDesc: "Pokazuje na co ustawiona jest podana opcja. Jeżeli chcesz ją edytować, wprowadź **/config <nazwaUstawienia> <wartosc>**. Użycie komendy: **/showConfig <nazwaUstawienia>**."
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