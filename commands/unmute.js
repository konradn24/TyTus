const Discord = require('discord.js')
const colors = require('../colors.json');

module.exports.run = async (bot, message, args) => {
    if(!message.member.hasPermission("MANAGE_ROLES")) return message.channel.send("Nie masz uprawnień do użycia tej komendy (MANAGE_ROLES)!");

    let unmute = message.mentions.members.first() || message.guild.members.get(args[0]);
    if(!unmute) return message.channel.send("Określ któremu użytkownikowi chcesz wyłączyć wyciszenie (przykładowe użycie komendy: **/unmute @konradn24**).");

    let muterole = message.guild.roles.find(r => r.name === "🔇┆Muted");
    if(!unmute.roles.find(r => r.name === "🔇┆Muted")) {
        message.delete();
        return message.channel.send("Ten użytkownik nie jest wyciszony!");
    }

    unmute.removeRole(muterole.id).then(() => {
        message.delete();
        message.channel.send(`Gotowe. ${unmute} może znów pisać!`);
    })
}

module.exports.config = {
    name: "unmute",
    aliases: ["um"],
    description: "Przywraca określonemu użytkownikowi możliwość pisania.",
    bigDesc: "Przywraca określonemu użytkownikowi możliwość pisania. Zapis wygląda następująco: **/unmute <@osoba>**."
}