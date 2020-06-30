const Discord = require('discord.js')
const colors = require('../colors.json');

module.exports.run = async (bot, message, args, database) => {
    if(!message.member.hasPermission("MANAGE_ROLES")) return message.channel.send("Nie masz uprawnień do użycia tej komendy (MANAGE_ROLES)!");
    if(!message.guild.me.hasPermission("MANAGE_ROLES")) return message.channel.send("Nie mam uprawnień potrzebnych do usunięcia wyciszenia z tego użytkownika! (MANAGE_ROLES)");

    let unmute = message.mentions.members.first() || message.guild.members.get(args[0]);
    if(!unmute) return message.channel.send("Określ któremu użytkownikowi chcesz wyłączyć wyciszenie (przykładowe użycie komendy: **/unmute @konradn24**).");

    database.query(`SELECT * FROM servers WHERE discordID = "${message.guild.id}"`, (err, rows) => {
        if(err) {
            console.log(err);
            return message.channel.send(`Wystąpił błąd 0! Spróbuj ponownie później.`);
        }

        if(rows.length < 1) return message.channel.send(":x: Nie możesz wyciszać użytkowników, ponieważ rola dla wyciszonych użytkowników nie została określona! Jeżeli chcesz to zmienić, wprowadź **/config muteRole <@rola>**.");

        let config = decode1(rows[0].config);
        if(config[9] === "N") return message.channel.send(":x: Nie możesz wyciszać użytkowników, ponieważ rola dla wyciszonych użytkowników nie została określona! Jeżeli chcesz to zmienić, wprowadź **/config muteRole <@rola>**.");

        var muteroleID = config[9];

        let muterole = message.guild.roles.find(r => r.id === muteroleID);
        if(!unmute.roles.find(r => r.id === muteroleID)) {
            message.delete();
            return message.channel.send("Ten użytkownik nie jest wyciszony!");
        }

        unmute.removeRole(muteroleID).then(() => {
            message.delete();
            message.channel.send(`Gotowe. ${unmute} może znów pisać!`);
        })
    });
}

module.exports.config = {
    name: "unmute",
    aliases: ["um"],
    description: "Przywraca określonemu użytkownikowi możliwość pisania.",
    bigDesc: "Przywraca określonemu użytkownikowi możliwość pisania. Zapis wygląda następująco: **/unmute <@osoba>**."
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