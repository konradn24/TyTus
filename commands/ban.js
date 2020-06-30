const Discord = require('discord.js')
const colors = require('../colors.json');

module.exports.run = async (bot, message, args, database) => {
    if(!message.member.hasPermission("BAN_MEMBERS")) return message.channel.send("Nie masz uprawnień do użycia tej komendy (BAN_MEMBERS)!");
    if(!message.guild.me.hasPermission("BAN_MEMBERS")) return message.channel.send("Nie mam uprawnień potrzebnych do zbanowania użytkownika! (BAN_MEMBERS)");

    let ban = message.mentions.members.first() || message.guild.members.get(args[0]);
    if(!ban) return message.channel.send("Określ kogo chcesz zbanować!");

    let reason = args.slice(1).join(" ");

    message.delete();
    if(reason) {
        ban.ban(ban, { days: 1, reason: reason }).catch(err => console.log(err));
    }

    if(!reason) {
        ban.ban(ban, { days: 1 }).catch(err => console.log(err));
    }

    message.channel.send(`**${ban.user.tag}** został zbanowany.`);
}

module.exports.config = {
    name: "ban",
    aliases: ["b", "banish", "remove"],
    description: "Banuje określonego użytkownika.",
    bigDesc: "Banuje określonego użytkownika, opcjonalnie można dodać powód. Zapis: **/ban <@osoba> <opcjonalnyPowód>**"
}