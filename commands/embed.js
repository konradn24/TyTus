const Discord = require('discord.js')
const colors = require('../colors.json');

module.exports.run = async (bot, message, args, database) => {
    if(!message.member.hasPermission("MANAGE_MESSAGES")) return message.channel.send(`:x: Nie masz uprawnień potrzebnych do użycia tego polecenia! (MANAGE_MESSAGES)`);

    if(!args[0]) return message.channel.send(`:x: Podaj kanał, a następnie treść osadzonej (embed) wiadomości!`);
    else if(!args[1]) return message.channel.send(`:x: Podaj treść wiadomości!`);
    else if(message.mentions.channels.size() < 1) return message.channel.send(`:x: Nie podano prawidłowego kanału! Przykład: **/embed #channel To jest osadzona wiadomość!**`);
    
    var channel = message.mentions.channels.first();
    var text = args.slice(1).join(" ");

    var embed = new Discord.RichEmbed()
    .setColor(colors.gold)
    .setDescription(text);

    var messageID = await channel.send(embed);
    var channelID = channel.id;
    var guildID = message.guild.id;
    await message.channel.send(`:white_check_mark: Gotowe! Kliknij w link, żeby zobaczyć wiadomość: https://discordapp.com/channels/${guildID}/${channelID}/${messageID}`);
}

module.exports.config = {
    name: "embed",
    aliases: ["embedMessage", "em"],
    description: "Wysyła osadzoną wiadomość o podaj treści na podany kanał.",
    bigDesc: "Wysyła osadzoną wiadomość o podaj treści na podany kanał. Użycie: **/embed <#kanał> <treść>**"
}
