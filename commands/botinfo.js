const Discord = require('discord.js')
const colors = require('../colors.json');
const package = require('../package.json');

module.exports.run = async (bot, message, args, database) => {
    // let bEmbed = new Discord.MessageEmbed()
    //     .setColor(colors.cyan)
    //     .setTitle("Bot Info")
    //     .setThumbnail(message.guild.iconURL)
    //     .addField("**Nazwa:**", "TyTus Bot", true)
    //     .addField("**Właściciel:**", `${message.channel.members.get("485062530629107746").displayName}`, true)
    //     .addField("**Przeznaczony dla:**", `${message.guild.owner.displayName}`, true)
    //     .addField("**Wersja:**", `${package.version}`, true)
    //     .setFooter("TyTus Bot", bot.user.displayAvatarURL);
    //     message.channel.send({embed: bEmbed});

    var text = `\`\`\`python\nNazwa: TyTus Bot\nWłaściciel: konradn24#3218\nSerwer: ${message.guild.name}\nWersja: ${package.version}\`\`\``;
    message.channel.send(text);
}

module.exports.config = {
    name: "botinfo",
    aliases: ["about", "bot"],
    description: "Zawiera najważniejsze informacje o programie.",
    bigDesc: "Zawiera najważniejsze informacje o programie, m.in.: oficjalną nazwę bota, właściciela i wersję."
}