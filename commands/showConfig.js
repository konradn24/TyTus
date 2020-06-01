const Discord = require('discord.js')
const colors = require('../colors.json');

const loading = "Ładowanie...";

module.exports.run = async (bot, message, args, database) => {
    if(!args[0]) return message.channel.send(":x: Podaj nazwę opcji, którą chcesz zobaczyć! Jeżeli potrzebujesz pełnej listy dostępnych ustawień, zajrzyj tutaj: **/help configs**.");

    response(message, loading);

    database.query(`SELECT * FROM config WHERE name = "${args[0]}"`, (err, rows) => {
        if(err) {
            console.log(err);
            response(message, ":x: Wystąpił błąd podczas odczytywania informacji z bazy danych! Spróbuj ponownie później.");
        } else {
            if(rows.length < 1) return message.channel.send(":x: Opcja o podanej nazwie nie istnieje! Jeżeli potrzebujesz pełnej listy dostępnych ustawień, zajrzyj tutaj: **/help configs**.");

            response(message, `:white_check_mark: Opcja *${args[0]}* jest obecnie ustawiona na: *${rows[0].value}*.`);
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