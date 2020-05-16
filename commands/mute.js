const Discord = require('discord.js')
const colors = require('../colors.json');

module.exports.run = async (bot, message, args, database) => {
    if(!message.member.hasPermission("MANAGE_ROLES")) return message.channel.send("Nie masz uprawnień do użycia tej komendy (MANAGE_ROLES)!");

    let mute = message.mentions.members.first() || message.guild.members.get(args[0]);
    if(!mute) return message.channel.send("Określ którego użytkownika chcesz wyciszyć (przykładowe użycie komendy: **/mute @konradn24 <opcjonalnyPowód>**).");

    let muterole = message.guild.roles.find(r => r.name === "🔇┆Muted");
    if(mute.roles.find(r => r.name === "🔇┆Muted")) {
        message.delete();
        return message.channel.send("Ten użytkownik jest już wyciszony!");
    }

    let reason = args.slice(1).join(" ");
    if(reason) {
        try {
            mute.addRole(muterole.id).then(() => {
                message.delete();
                message.channel.send(`${mute} został wyciszony! Powód: ${reason}.`);
            })
        } catch(e) {
            message.delete();
            message.channel.send(`Błąd 0x002.`);
        }
    }

    if(!reason) {
        try {
            mute.addRole(muterole.id).then(() => {
                message.delete();
                message.channel.send(`${mute} został wyciszony!`);
            })
        } catch(e) {
            message.delete();
            message.channel.send(`Błąd 0x002.`);
        }
    }
}

module.exports.config = {
    name: "mute",
    aliases: ["m"],
    description: "Wycisza użytkownika na serwerze.",
    bigDesc: "Wycisza użytkownika na serwerze poprzez nadanie odpowiedniej roli \"muted\", można określić powód (**/mute <@osoba> <powód>**), lecz nie jest to wymagane. Wyciszony użytkownik ma dostęp tylko do kategorii \"Więzienie\"."
}