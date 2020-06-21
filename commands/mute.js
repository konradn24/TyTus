const Discord = require('discord.js')
const colors = require('../colors.json');

module.exports.run = async (bot, message, args, database) => {
    if(!message.member.hasPermission("MANAGE_ROLES")) return message.channel.send("Nie masz uprawnień do użycia tej komendy (MANAGE_ROLES)!");

    let mute = message.mentions.members.first() || message.guild.members.get(args[0]);
    if(!mute) return message.channel.send("Określ którego użytkownika chcesz wyciszyć (przykładowe użycie komendy: **/mute @konradn24 <opcjonalnyPowód>**).");

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
        if(!muterole) return message.channel.send(`Rola podana w ustawieniu "muteRole" nie istnieje (być może została usunięta). Proszę uaktualnić to ustawienie, poleceniem **/config muteRole <@rola>**.`);

        if(mute.roles.find(r => r.id === muteroleID)) {
            message.delete();
            return message.channel.send("Ten użytkownik jest już wyciszony!");
        }

        let reason = args.slice(1).join(" ");
        if(reason) {
            try {
                mute.addRole(muteroleID).then(() => {
                    message.delete();
                    message.channel.send(`${mute} został wyciszony! Powód: ${reason}.`);
                })
            } catch(e) {
                message.delete();
                message.channel.send(`Błąd 1.`);
            }
        }

        if(!reason) {
            try {
                mute.addRole(muteroleID).then(() => {
                    message.delete();
                    message.channel.send(`${mute} został wyciszony!`);
                })
            } catch(e) {
                message.delete();
                message.channel.send(`Błąd 1.`);
            }
        }
    });
}

module.exports.config = {
    name: "mute",
    aliases: ["m"],
    description: "Wycisza użytkownika na serwerze.",
    bigDesc: "Wycisza użytkownika na serwerze poprzez nadanie odpowiedniej roli \"muted\", można określić powód (**/mute <@osoba> <powód>**), lecz nie jest to wymagane. Wyciszony użytkownik ma dostęp tylko do kategorii \"Więzienie\"."
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