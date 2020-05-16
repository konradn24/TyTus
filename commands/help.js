const Discord = require('discord.js')
const colors = require('../colors.json');

module.exports.run = async (bot, message, args, database) => {
    if(args[0]) {
        if(args[0] === "configs") {
            database.query(`SELECT * FROM config`, (err, rows) => {
                if(err) return console.log(err);
                var text = "**/showConfig <nazwaUstawienia>**, żeby wyświetlić aktualną wartość dla danego ustawienia. \n **/config <nazwaUstawienia> <wartosc>**, żeby zmienić wybrane ustawienie. \n \n";
                for(var i = 0; i < rows.length; i++) {
                    var values;
                    switch(rows[i].allowedValues) {
                        case "number": {
                            values = "liczba";
                            break;
                        }
                        case "boolean": {
                            values = "true / false";
                            break;
                        }
                        case "ALL": {
                            values = "wszystko (tekst, liczby)";
                            break;
                        }
                        default: {
                            values = "nie określono";
                            break;
                        }
                    }
                    text += `\`${rows[i].name}\` - ${rows[i].description} Dopuszczalne wartości: *${values}*.\n\n`;
                }

                message.channel.send(text);
            });
        }

        let command = args[0];
        if(bot.commands.has(command)) {
            command = bot.commands.get(command);
            // var bhembed = new Discord.MessageEmbed()
            // .setColor(colors.red_dark)
            // .setAuthor('TyTus Bot Pomoc', message.guild.iconURL)
            // .setDescription(`**Polecenie:** ${command.config.name}\n**Opis:** ${command.config.bigDesc || "Brak opisu."}`)
            // message.channel.send(bhembed);

            var text = `**Polecenie:** ${command.config.name}\n**Opis:** ${command.config.bigDesc}`;
            message.channel.send(text);
        }
    } else {
        var text = `Wprowadź **/help <nazwaKomendy>**, żeby więcej się o niej dowiedzieć\n\n \`help\` \n \`help <nazwaKomendy>\` \n \`test\` \n \`botinfo\` \n \`ban\` \n \`mute\` \n \`unmute\` \n \`config\` \n \`showConfig\` \n \`resetLevels\` \n \`level\``;
        message.channel.send(text);
    }
}

module.exports.config = {
    name: "help",
    aliases: ["pomoc", "info", "commands"],
    description: "Wyświetla wszystkie polecenia i ich opisy. Wprowadź nazwę komendy po **/help**, żeby zobaczyć jej dokładny opis (przykład: **/help ban**).",
    bigDesc: "Wyświetla wszystkie polecenia i ich opisy. Wprowadź nazwę komendy po **/help**, żeby zobaczyć jej dokładny opis (przykład: **/help ban**)."
}