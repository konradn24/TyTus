const Discord = require('discord.js');
const colors = require('../colors.json');

module.exports.run = async (bot, message, args, database) => {
    if(!message.member.hasPermission("ADMINISTRATOR")) return message.channel.send("Nie masz uprawnień do użycia tej komendy (ADMINISTRATOR)!");

    if(!args[0]) return message.channel.send("Określ kanał! Jeżeli potrzebujesz pomocy, wprowadź **/help createRR**.");
    else if(!args[1]) return message.channel.send("Określ treść wiadomości reaction roles! Jeżeli potrzebujesz pomocy, wprowadź **/help createRR**.");

    var channel = message.mentions.channels.first();
    var text = "";
    for(var i = 1; i < args.length; i++) {
        text += `${args[i]} `;
    }

    var roles;
    var emojis;
    var configs = "";

    const filter = m => m.author.id === message.author.id;
    message.channel.send(":white_check_mark: Ok! Wpisz teraz po kolei wszystkie role, które będzie można sobie dodać, a następnie dodaj do wiadomości z rolami po kolei reakcje, które będą kolejno odpowiadać rangom (układ: <@rola> <@rola> <@rola> ...).\nWprowadź: **cancel**, żeby anulować; **settings**, żeby pokazać dodatkowe ustawienia (dopiero po napisaniu rang i dodaniu reakcji); **ok**, żeby zatwierdzić.\nGdy wypiszesz wszystkie role i dodasz reakcje, wprowadź **ok**.\nMasz 2 minuty czasu, potem dodawanie RR wygaśnie!");
    const collector = message.channel.createMessageCollector(filter, { time: 120000 });

    var success = true;
    var settings = false;
    var sent = 0;

    collector.on('collect', m => {
        if(m.content === "cancel") {
            success = false;
            return collector.stop();
        } else if(m.content === "settings") {
            settings = true;
            var embed = new Discord.RichEmbed()
            .setColor(colors.white)
            .setDescription("**verifySystem <@ranga>** - ta wiadomość reaction roles, będzie usuwać podaną rangę, gdy użytkownik doda sobie jakąś rolę poprzez tą wiadomość.");
            message.channel.send(embed);
        } else if(settings) {
            let argsArray = m.content.split(" ");
            let cmd = argsArray[0];
            let args = argsArray.slice(1);
            
            if(cmd === "verifySystem") {
                let roleToRemove = m.mentions.roles.first();
                if(!roleToRemove) return message.channel.send(":x: Podaj rangę!");

                if(configs.split("-").length > 0) configs += `-verifySystem:${roleToRemove.id}`;
                else configs += `verifySystem:${roleToRemove.id}`;

                message.channel.send(":white_check_mark: Zmieniono ustawienie *verifySystem* dla tej wiadomości!");
            } else if(cmd === "ok") {
                if(sent === 0) {
                    success = false;
                    return collector.stop();
                } else {
                    success = true;
                    return collector.stop();
                }
            } else if(cmd === "cancel") {
                success = false;
                return collector.stop();
            }
        } else if(m.content === "ok") {
            if(sent === 0) {
                success = false;
                return collector.stop();
            } else {
                success = true;
                return collector.stop();
            }
        } else sent++;
    });

    const reactionFilter = (reaction, user) => ['❌', '✅'].includes(reaction.emoji.name) && user.id === message.author.id;

    collector.on('end', (collected, reason) => {
        if(reason === "time") {
            return message.channel.send(`:x: Upłynął limit czasu! Zakończono dodawanie RR automatycznie.`);
        } else if(reason === "user") {
            if(success) { //ASKING IF USER IS SURE AND COLLECTING REACTIONS
                message.channel.send(`Czy jesteś pewny, że chcesz dodać wiadomość typu reaction roles na kanale ${channel}?\n:white_check_mark: - **tak**\n:x: - **nie**`).then(async sentMessage => {
                    await sentMessage.react('❌');
                    await sentMessage.react('✅');

                    const reactionsCollector = sentMessage.createReactionCollector(reactionFilter, { time: 60000});

                    var sure = true;
                    reactionsCollector.on('collect', (reaction, reactionCollector) => {
                        if(reaction.emoji.name === '❌') {
                            sure = false;
                            return reactionsCollector.stop();
                        } else if(reaction.emoji.name === '✅') {
                            sure = true;
                            return reactionsCollector.stop();
                        }
                    });

                    reactionsCollector.on('end', (reactions, reason) => {
                        if(reason === 'time') return message.channel.send(`:x: Upłynął limit czasu! Zakończono dodawanie RR automatycznie.`);
                        else if(reason === 'user') {
                            if(sure) {
                                //GETTING ALL VARIABLES
                                var collectedMsgFromMember = collected.first();
                                var numRoles = collectedMsgFromMember.mentions.roles.size;
                                var numEmojis = collectedMsgFromMember.reactions.size;

                                //CHECKING FOR ERRORS
                                if(numEmojis != numRoles) return message.channel.send(`:x: Ilość ról (${collectedMsgFromMember.mentions.roles.size}) nie zgadza się z ilością reakcji (${collectedMsgFromMember.reactions.size})!`);
                                else if(numEmojis === 0) return message.channel.send(`:x: Nie oznaczono żadnej roli i nie dodano reakcji!`);

                                //CREATING ROLES AND EMOJIS ARRAYS
                                roles = new Array(numRoles);
                                emojis = new Array(numEmojis);

                                //CREATING NEW ARRAYS AND ADDING ELEMENTS FROM MESSAGE TO 'ROLES' AND 'EMOJIS' ARRAYS
                                var rolesTextToDB = "";
                                var emojisTextToDB = "";
                                let formattedMsg = collectedMsgFromMember.content.split(' ');

                                if(formattedMsg.length != numRoles) return message.channel.send(`:x: Wystąpił błąd przy formatowaniu wiadomości! Upewnij się, czy spacje są tylko pomiędzy rolami i nigdzie indziej.`);

                                for(var i = 0; i < numRoles; i++) {
                                    formattedMsg[i] = formattedMsg[i].replace('<@&', '').replace('>', '');
                                    roles[i] = formattedMsg[i];
                                    emojis[i] = collectedMsgFromMember.reactions.array()[i].emoji.name;

                                    if(i === 0) {
                                        rolesTextToDB += `${roles[i]}`;
                                        emojisTextToDB += `${emojis[i]}`;
                                    } else {
                                        rolesTextToDB += `-${roles[i]}`;
                                        emojisTextToDB += `-${emojis[i]}`;
                                    }
                                }

                                var embed = new Discord.RichEmbed()
                                .setColor(colors.aqua)
                                .setDescription(`${text}`);

                                channel.send(embed).then(async m => {
                                    database.query(`INSERT INTO reaction_roles VALUES(NULL, "${m.id}", "${channel.id}", "${rolesTextToDB}", "${emojisTextToDB}", "${configs}")`, async (err) => {
                                        if(err) {
                                            message.channel.send(`:x: Wystąpił błąd podczas dodawania do bazy danych! Spróbuj ponownie później.`);
                                            console.log(err);
                                            return m.delete();
                                        }

                                        for(var i = 0; i < numEmojis; i++) {
                                            await m.react(emojis[i]);
                                        }

                                        return message.channel.send(`:white_check_mark: Pomyślnie dodano wiadomość typu reaction roles na kanale ${channel}!`);
                                    });
                                });
                            } else return message.channel.send(`:x: Anulowano!`);
                        }
                    });
                });
            } else
                return message.channel.send(`:x: Anulowano!`);
        } else if(reason === "limit") {
            message.channel.send(`:x: Wysłano zbyt dużo wiadomości!`);
        }
    });
}

module.exports.config = {
    name: "createRR",
    aliases: ["newRR", "addRR", "rr"],
    description: "Tworzy nową wiadomość typu reaction roles. Dostępne tylko dla administratorów!",
    bigDesc: "Tworzy nową wiadomość typu reaction roles. Dostępne tylko dla administratorów! Użycie komendy: **/createRR <kanal> <ileRól> <tresc>**"
}
