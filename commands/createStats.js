const Discord = require('discord.js')
const colors = require('../colors.json');

module.exports.run = async (bot, message, args, database) => {
    if(!message.member.hasPermission('MANAGE_CHANNELS')) return message.channel.send("Nie masz uprawnień do użycia tej komendy! (MANAGE_CHANNELS)");
    if(!message.guild.me.hasPermission('MANAGE_CHANNELS')) return message.channel.send("Nie mam odpowiednich uprawnień potrzebnych do utworzenia kanałów! (MANAGE_CHANNELS)");

    database.query(`SELECT * FROM servers WHERE discordID = "${message.guild.id}"`, async (err1, rows1) => {
        if(err1) {
            console.log(err1);
            return message.channel.send(":x: Wystąpił błąd podczas łączenia się z bazą danych! (servers) Spróbuj ponownie później.");
        }

        if(rows1.length < 1) {
            return message.channel.send(":x: Twój serwer nie jest zapisany w bazie danych. Powinien zostać za niedługo dodany, wtedy będziesz mógł skorzystać z tego polecenia.")
        }

        var statsAmount = 2;
        var toCreate = [`members=Członkowie: ${message.guild.memberCount}`, `new=Nowy: -`];
        let config = decode1(rows1[0].config);

        if(!args[0]) {
            const filter = m => m.author.id === message.author.id;

            message.channel.send("Czy na pewno chcesz utworzyć kanały dla takich statystyk? (yes/no)\n1. Ilość członków serwera\n2. Nowy członek serwera");

            const collector = message.channel.createMessageCollector(filter, { time: 120000 });

            var success = false;

            collector.on('collect', async m => {
                if(m.content === "yes") {
                    success = true;
                    return collector.stop();
                } else if(m.content === "no") {
                    success = false;
                    return collector.stop();
                }
            });

            collector.on('end', async (collected, reason) => {
                if(reason === "time") return message.channel.send(":x: Upłynął limit czasu na odpowiedź!");
                else if(reason === "user") {
                    if(success) {
                        var passed = 0;
                        var errors = 0;

                        var channelsID = new Array(statsAmount);

                        for(var i = 0; i < statsAmount; i++) {
                            var stat = toCreate[i].split("=")[0];
                            var name = toCreate[i].split("=")[1];

                            const created = await message.guild.createChannel(name, { type: "voice" });

                            if(created) {
                                channelsID[i] = created.id;

                                switch(stat) {
                                    case "members": {
                                        config[11] = created.id;
                                        break;
                                    }

                                    case "new": {
                                        config[12] = created.id;
                                        break;
                                    }

                                    default: {
                                        console.log("Statystyka " + stat + " nie została znaleziona. Nie będzie ona zapisana w config'u serwera " + bot.guilds.find('id', message.guild.id).name + " !!!");
                                        break;
                                    }
                                }

                                message.channel.send(`Utworzono kanał "${name}" (${i}) dla statystyki "${stat}". Zapisano do bazy danych.`);
                                passed++;
                            } else {
                                message.channel.send(`Nie udało się stworzyć kanału "${name}" (${i}) dla statystyki "${stat}".`);
                                errors++;
                            }
                        }
                    } else {
                        return message.channel.send(":x: Anulowano!");
                    }
                }
            });
        }

        if(args[0]) {
            for(var i = 0; i < statsAmount; i++) {
                args.forEach(element => {
                    if(element === toCreate[i].split("=")[0]) {
                        statsAmount--;
                        toCreate.splice(i, 1);
                    }
                });
            }

            const filter = m => m.author.id === message.author.id;

            var text = "Czy na pewno chcesz utworzyć kanały dla takich statystyk? (yes/no)";
            for(var i = 0; i < statsAmount; i++) { //NEEDS TO BE UPDATED AFTER ADDING STATISTIC
                if(toCreate[i].split("=")[0] === "members") text += `\n${i + 1}. Ilość członków serwera`;
                if(toCreate[i].split("=")[0] === "new") text += `\n${i + 1}. Nowy członek serwera`;
            }

            message.channel.send(text);

            const collector = message.channel.createMessageCollector(filter, { time: 120000 });

            var success = false;

            collector.on('collect', async m => {
                if(m.content === "yes") {
                    success = true;
                    return collector.stop();
                } else if(m.content === "no") {
                    success = false;
                    return collector.stop();
                }
            });

            collector.on('end', async (collected, reason) => {
                if(reason === "time") return message.channel.send(":x: Upłynął limit czasu na odpowiedź!");
                else if(reason === "user") {
                    if(success) {
                        var passed = 0;
                        var errors = 0;

                        var channelsID = new Array(statsAmount);

                        for(var i = 0; i < statsAmount; i++) {
                            var stat = toCreate[i].split("=")[0];
                            var name = toCreate[i].split("=")[1];

                            const created = await message.guild.createChannel(name, { type: "voice" });

                            if(created) {
                                channelsID[i] = created.id;

                                switch(stat) {
                                    case "members": {
                                        config[11] == created.id;
                                        break;
                                    }

                                    case "new": {
                                        config[12] == created.id;
                                        break;
                                    }

                                    default: {
                                        console.log("Statystyka " + stat + " nie została znaleziona. Nie będzie ona zapisana w config'u serwera " + bot.guilds.find('id', message.guild.id).name + " !!!");
                                        break;
                                    }
                                }

                                message.channel.send(`Utworzono kanał "${name}" (${i}) dla statystyki "${stat}". Zapisano do bazy danych.`);
                                passed++;
                            } else {
                                message.channel.send(`Nie udało się stworzyć kanału "${name}" (${i}) dla statystyki "${stat}".`);
                                errors++;
                            }
                        }
                    } else {
                        return message.channel.send(":x: Anulowano!");
                    }
                }
            });
        }

        var changedTextConfig = "";
        for(var i = 0; i < config.length; i++) {
            changedTextConfig += config[i] + "/NF";
        }

        changedTextConfig = changedTextConfig.substr(0, changedTextConfig.length - 3);

        database.query(`UPDATE servers SET config = "${changedTextConfig}" WHERE discordID = "${message.guild.id}"`, console.log);
    });
}

module.exports.config = {
    name: "createStats",
    aliases: ["cs", "allStats"],
    description: "Automatycznie tworzy nowe kanały ze statystykami.",
    bigDesc: "Automatycznie tworzy nowe kanały ze statystykami (uprawnienia trzeba ustawić ręcznie). Można dodatkowo podać, których statystyk bot ma nie tworzyć (np. **/createStats members clock date**, kolejność nie ma znaczenia). Aby uzyskać listę dostępnych statystyk wprowadź **/help stats**."
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
