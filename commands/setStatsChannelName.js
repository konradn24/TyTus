const Discord = require('discord.js')
const colors = require('../colors.json');

module.exports.run = async (bot, message, args, database) => {
    if(!message.member.hasPermission('MANAGE_CHANNELS')) return message.channel.send("Nie masz uprawnień do użycia tej komendy! (MANAGE_CHANNELS)");
    if(!message.guild.me.hasPermission('MANAGE_CHANNELS')) return message.channel.send("Nie mam odpowiednich uprawnień potrzebnych do zmiany nazwy kanału! (MANAGE_CHANNELS)");

    if(!args[0]) return message.channel.send(`:x: Podaj nazwę statystyki, a następnie nową nazwę kanału. Jeżeli potrzebujesz pomocy z komendą, wprowadź **/help setStatChannelName**. Lista statystyk: **/help stats**`);
    if(!args[1]) return message.channel.send(`:x: Podaj nową nazwę kanału. Jeżeli potrzebujesz pomocy z komendą, wprowadź **/help setStatChannelName**. Lista statystyk: **/help stats**`);

    var statistic = args[0];
    if(!statistic.startsWith("stats-")) return response(message, ":x: Podano złą nazwę statystyki! Pamiętaj, żeby nazwę każdej statystyki poprzedzało **stats-**. Jeżeli potrzebujesz pełnej listy dostępnych statystyk, wpisz **/help stats**.");

    args[1] = args.slice(1).join(" ");

    database.query(`SELECT * FROM config WHERE name = ${database.escape(statistic.replace(`stats-`, `statsname-`))}`, (err, rows) => {
        if(err) {
            console.log(err);
            return message.channel.send(":x: Wystąpił błąd podczas łączenia się z bazą danych! (config) Spróbuj ponownie później.");
        }

        if(rows.length < 1) return response(message, ":x: Podano złą nazwę statystyki! Jeżeli potrzebujesz pełnej listy dostępnych statystyk, wpisz **/help stats**.");
    
        database.query(`SELECT * FROM servers WHERE discordID = "${message.guild.id}"`, (err1, rows1) => {
            if(err1) {
                console.log(err1);
                return message.channel.send(":x: Wystąpił błąd podczas łączenia się z bazą danych! (servers) Spróbuj ponownie później.");
            }

            if(rows1.length < 1) return response(message, `:x: Twój serwer nie jest zapisany w bazie danych. Powinien zostać za niedługo dodany, wtedy będziesz mógł skorzystać z tego polecenia.`);
       
            let config = decode1(rows1[0].config);
            var configID = rows[0].id - 1;
            var thisConfig = config[configID];

            if(thisConfig === args[1]) return response(message, `:white_check_mark: Kanał z tą statystyką ma aktualnie taką nazwę.`);
            else if(!args[1].includes("{}")) response(message, `:warning: W nazwie kanału nie znajduje się "{}", czyli wartość statystyki (np. ilość członków serwera dla "stats-members" albo data dla "stats-date")!`);
        
            config[configID] = args[1];

            var changedTextConfig = "";
            for(var i = 0; i < config.length; i++) {
                changedTextConfig += config[i] + "/NF";
            }

            changedTextConfig = changedTextConfig.substr(0, changedTextConfig.length - 3);

            database.query(`UPDATE servers SET config = ${database.escape(changedTextConfig)} WHERE discordID="${message.guild.id}"`, () => { message.channel.send(`:white_check_mark: Ustawiono nazwę kanału ze statystyką "${statistic}" na "${args[1]}". Nowa nazwa będzie wkrótce widoczna gdy zajdzie aktualizacja statystyki. Poprzednia nazwa: "${thisConfig}"`); });
        });
    });
}

module.exports.config = {
    name: "setStatsChannelName",
    aliases: ["setStatsName", "scn", "statsChannelName"],
    description: "Umożliwia zmianę domyślnej nazwy kanału z jakąś statystyką (przykładowo z *Członkowie: {}* na *{} użytkowników na serwerze*, gdzie *{}* zastępuje ilość członków serwera). Użycie: **/setStatsChannelName <statystyka (np. stats-members)> <nowa nazwa kanału, {} zastępuje wartość>**",
    bigDesc: "Umożliwia zmianę domyślnej nazwy kanału z jakąś statystyką (przykładowo z *Członkowie: {}* na *{} użytkowników na serwerze*, gdzie *{}* zastępuje ilość członków serwera). Użycie: **/setStatsChannelName <statystyka (np. stats-members)> <nowa nazwa kanału, {} zastępuje wartość>**"
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