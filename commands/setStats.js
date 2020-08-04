const Discord = require('discord.js')
const colors = require('../colors.json');

module.exports.run = async (bot, message, args, database) => {
    if(!message.member.hasPermission('MANAGE_CHANNELS')) return message.channel.send("Nie masz uprawnień do użycia tej komendy! (MANAGE_CHANNELS)");
    if(!message.guild.me.hasPermission('MANAGE_CHANNELS')) return message.channel.send("Nie mam odpowiednich uprawnień potrzebnych do zmiany nazwy kanału! (MANAGE_CHANNELS)");

    if(!args[0]) return response(message, `:x: Podaj nazwę statystyki dla której chcesz ustawić kanał! Lista jest dostępna pod komendą: **/help stats**`);
    if(!args[1]) return response(message, `:x: Podaj nazwę kanału, na którym ma być wyświetlana ta statystyka! __UWAGA: nazwa nie może zawierać spacji!__`);

    var statistic = args[0];
    if(!statistic.startsWith("stats-")) return response(message, ":x: Podano złą nazwę statystyki! Pamiętaj, żeby nazwę każdej statystyki poprzedzało **stats-**. Jeżeli potrzebujesz pełnej listy dostępnych statystyk, wpisz **/help stats**.");
    var channel = message.guild.channels.find('name', args[1]);
    if(!message.guild.channels.find('name', args[1])) return response(message, `:x: Nie znalazłem kanału o takiej nazwie! Pamiętaj o tym, że nazwa kanału nie może zawierać spacji!`);

    var channelID = channel.id;

    var statDetails = statistic.split("-");
    var channelName = `statsname-${statDetails[1]}`;

    database.query(`SELECT * FROM config WHERE name = "${statistic}" OR name = "${channelName}"`, (err, rows) => {
        if(err) return console.log(err);
        if(rows.length < 2) return response(message, ":x: Podano złą nazwę statystyki! Jeżeli potrzebujesz pełnej listy dostępnych statystyk, wpisz **/help stats**.");

        database.query(`SELECT * FROM servers WHERE discordID = "${message.guild.id}"`, (err1, rows1) => {
            if(err1) {
                console.log(err1);
                return message.channel.send(":x: Wystąpił błąd podczas łączenia się z bazą danych! (servers) Spróbuj ponownie później.");
            }

            if(rows1.length < 1) return response(message, `:x: Twój serwer nie jest zapisany w bazie danych. Powinien zostać za niedługo dodany, wtedy będziesz mógł skorzystać z tego polecenia.`);

            let config = decode1(rows1[0].config);
            var configID = rows[0].id - 1;
            var thisConfig = config[configID];

            var nameConfigID = rows[1].id - 1;
            var thisNameConfig = config[nameConfigID];

            if(thisConfig === channelID) return response(message, `:white_check_mark: Ta statystyka jest już przypisana do tego kanału.`);

            var lastValue = thisConfig;

            config[configID] = channelID;

            var changedTextConfig = "";
            for(var i = 0; i < config.length; i++) {
                changedTextConfig += config[i] + "/NF";
            }

            changedTextConfig = changedTextConfig.substr(0, changedTextConfig.length - 3);

            database.query(`UPDATE servers SET config = "${changedTextConfig}" WHERE discordID = "${message.guild.id}"`, (err, rows) => {
                if(err) {
                    console.log(err);
                    response(message, ":x: Niestety zmiana się nie powiodła! Spróbuj ponownie później.");
                } else {
                    var toReplace;
                    switch(statDetails[1]) {
                        case "members": {
                            toReplace = message.guild.memberCount;
                            break;
                        }
                        case "new": {
                            toReplace = "-";
                            break;
                        }
                        case "online": {
                            toReplace = "WKRÓTCE";
                            break;
                        }
                        case "bestonline": {
                            toReplace = "WKRÓTCE";
                            break;
                        }
                        case "date": {
                            var date = new Date();

                            var day = date.getDate();
                            var month = date.getMonth() + 1;
                            var year = date.getFullYear();

                            toReplace = `${day}.${month}.${year}`;
                            break;
                        }
                        case "time": {
                            var date = new Date();

                            var hour = date.getHours();
                            var minute = date.getMinutes();

                            toReplace = `${hour}:${minute}`;
                            break;
                        }
                        case "role": {
                            toReplace = "WKRÓTCE";
                            break;
                        }
                        case "bots": {
                            toReplace = "WKRÓTCE";
                            break;
                        }
                        case "humans": {
                            toReplace = "WKRÓTCE";
                            break;
                        }
                        default: {
                            toReplace = "{ERR}";
                            break;
                        }
                    }

                    thisNameConfig = thisNameConfig.replace("{}", toReplace);
                    channel.setName(thisNameConfig);

                    response(message, `:white_check_mark: Pomyślnie zmieniono statystykę ${statistic}. Poprzednia wartość: *${lastValue}*. Nowa wartość: *${channelID}*. Jeżeli chcesz zmienić nazwę kanału z tą statystyką (z np. **Członkowie: {}** na np. **Mamy {} osób**) wprowadź **/setStatisticName <statystyka (np. stats-members)> <nowy tekst ({} = wartość tej statystyki)>**`);
                }
            });
        });
    });
}

module.exports.config = {
    name: "setStats",
    aliases: ["ss", "addStats"],
    description: "Przypisuje statystykę do kanału. **/help stats**, żeby zobaczyć listę dostępnych statystyk.",
    bigDesc: "Przypisuje statystykę do kanału. **/help stats**, żeby zobaczyć listę dostępnych statystyk. Format: **/setStats <nazwa statystyki> <nazwa kanału>**. Przykładowe użycie: **/setStats new kanał-głosowy-1**. Jeżeli chcesz zmienić nazwę kanału po przypisaniu statystyki, zajrzyj tutaj: **/help setStatsChannelName**."
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