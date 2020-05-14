const Discord = require('discord.js')
const colors = require('../colors.json');

module.exports.run = async (bot, message, args) => {
    if(args[0]) {
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
        var hembed = new Discord.MessageEmbed()
        .setColor(colors.red_light)
        .setAuthor('TyTus Bot Pomoc', message.guild.iconURL)
        .setDescription(`Wprowadź **/help <nazwaKomendy>**, żeby więcej się o niej dowiedzieć\n\n \`help\` \n \`help <nazwaKomendy>\` \n \`test\` \n \`botinfo\``)
        message.channel.send(hembed);
    }
}

module.exports.config = {
    name: "help",
    aliases: ["pomoc", "info", "commands"],
    description: "Wyświetla wszystkie polecenia i ich opisy. Wprowadź nazwę komendy po **/help**, żeby zobaczyć jej dokładny opis (przykład: **/help ban**).",
    bigDesc: "Wyświetla wszystkie polecenia i ich opisy. Wprowadź nazwę komendy po **/help**, żeby zobaczyć jej dokładny opis (przykład: **/help ban**)."
}