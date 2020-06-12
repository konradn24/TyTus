const Discord = require('discord.js')
const colors = require('../colors.json');

const loading = "Zmienianie ustawień...\n";

module.exports.run = async (bot, message, args, database) => {
    if(!message.member.hasPermission("ADMINISTRATOR") && !message.member.hasPermission("MANAGE_GUILD")) return message.channel.send("Nie masz uprawnień do użycia tej komendy (ADMINISTRATOR lub MANAGE_GUILD)!");

    if(!args[0]) {
        return message.channel.send(":x: Wprowadź nazwę ustawienia, a następnie wartość na którą chcesz je zmienić!");
    } else if(!args[1]) {
        return message.channel.send(":x: Wprowadź nową wartość dla tego ustawienia!");
    }
    
    args[1] = args.slice(1).join(" ");

    message.channel.send(loading);

    database.query(`SELECT * FROM config WHERE name = "${args[0]}"`, (err, rows) => {
        if(err) return console.log(err);
        if(rows.length < 1) return response(message, ":x: Podano złą nazwę ustawienia! Jeżeli potrzebujesz pełnej listy dostępnych ustawień, wpisz **/help configs**.");
        
        var wrongTypeOfValue = false;
        var channel = false;
        switch(rows[0].allowedValues) {
            case "number": {
                var type = typeof args[1];
                if(type != "number") wrongTypeOfValue = true;
                break;
            }
            case "boolean": {
                if(args[1] != "true" && args[1] != "false") wrongTypeOfValue = true;
                break;
            }
            case "channel": {
                if(message.mentions.channels.size < 1) wrongTypeOfValue = true;
                else channel = true;
                break;
            }
        }

        if(wrongTypeOfValue) return response(message, ":x: Podano nieprawidłowy typ wartości! Jeżeli nie wiesz, jaki typ wartości jest dozwolony w tym ustawieniu, wpisz **/help configs**.");
        if(channel) args[1] = message.mentions.channels.first().id;
        
        if(rows[0].value === args[1]) return response(message, `:x: Ta opcja ma już aktualnie ma taką wartość!`);

        var lastValue = rows[0].value;

        database.query(`UPDATE config SET value = "${args[1]}" WHERE name = "${args[0]}"`, (err, rows) => {
            if(err) {
                console.log(err);
                response(message, ":x: Niestety zmiana ustawienia się nie powiodła! Spróbuj ponownie później.");
            } else {
                response(message, `:white_check_mark: Pomyślnie zmieniono ustawienie ${args[0]}. Poprzednia wartość: *${lastValue}*. Nowa wartość: *${args[1]}*.`);
            }
        });
    });
}

module.exports.config = {
    name: "config",
    aliases: ["settings", "sets"],
    description: "Umożliwia zmianę przeróżnych ustawień konfiguracyjnych bota.",
    bigDesc: "Umożliwia zmianę przeróżnych ustawień konfiguracyjnych bota (m.in. wysyłanie wiadomości kiedy użytkownik zdobędzie następny poziom za aktywność). Użycie komendy: **/config <nazwaUstawienia> <wartosc>**.Wprowadź **/help configs** żeby ujrzeć wszystkie dostępne ustawienia"
}

function response(message, response) {
    message.channel.send(response);
}
