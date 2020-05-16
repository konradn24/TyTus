const Discord = require('discord.js')
const colors = require('../colors.json');

module.exports.run = async (bot, message, args, database) => {
    if(!message.member.hasPermission("ADMINISTRATOR") && !message.member.hasPermission("MANAGE_GUILD")) return message.channel.send("Nie masz uprawnień do użycia tej komendy (ADMINISTRATOR lub MANAGE_GUILD)!");

    if(!args[0]) {
        return message.channel.send(":x: Wprowadź nazwę ustawienia, a następnie wartość na którą chcesz je zmienić!");
    } else if(!args[1]) {
        return message.channel.send(":x: Wprowadź nową wartość dla tego ustawienia!");
    }

    database.query(`SELECT * FROM config WHERE name = "${args[0]}"`, (err, rows) => {
        if(err) return console.log(err);
        if(rows.length < 1) return message.channel.send(":x: Podano złą nazwę ustawienia! Jeżeli potrzebujesz pełnej listy dostępnych ustawień, wpisz **/help configs**.");
        
        var wrongTypeOfValue = false;
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
        }

        if(wrongTypeOfValue) return message.channel.send(":x: Podano nieprawidłowy typ wartości! Jeżeli nie wiesz, jaki typ wartości jest dozwolony w tym ustawieniu, wpisz **/help configs**.");
    
        if(rows[0].value === args[1]) return message.channel.send(`:x: Ta opcja ma już aktualnie ma taką wartość!`);

        var lastValue = rows[0].value;

        database.query(`UPDATE config SET value = "${args[1]}" WHERE name = "${args[0]}"`, (err, rows) => {
            if(err) {
                console.log(err);
                message.channel.send(":x: Niestety zmiana ustawienia się nie powiodła! Spróbuj ponownie później.");
            } else {
                message.channel.send(`:white_check_mark: Pomyślnie zmieniono ustawienie ${args[0]}. Poprzednia wartość: *${lastValue}*. Nowa wartość: *${args[1]}*.`);
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