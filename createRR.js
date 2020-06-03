const Discord = require('discord.js');
const colors = require('../colors.json');

module.exports.run = async (bot, message, args, database) => {
    if(!message.member.hasPermission("ADMINISTRATOR")) return message.channel.send("Nie masz uprawnień do użycia tej komendy (ADMINISTRATOR)!");

    if(!args[0]) return message.channel.send("Określ kanał! Jeżeli potrzebujesz pomocy, wprowadź **/help createRR**.");
    else if(!args[1]) return message.channel.send("Podaj ilość ról, które użytkownicy będą mogli sobie przyznać! Jeżeli potrzebujesz pomocy, wprowadź **/help createRR**.");
    else if(!args[2]) return message.channel.send("Określ treść wiadomości reaction roles! Jeżeli potrzebujesz pomocy, wprowadź **/help createRR**.");
    else if(isNaN(parseInt(args[1])) || parseInt(args[1]) < 1) return message.channel.send("Podana ilość ról nie jest liczbą dodatnią! Wprowadź liczbę większą od 0.");

    var channel = message.mentions.channels.first();
    var numRoles = parseInt(args[1]);
    var text = "";
    for(var i = 2; i < args.length; i++) {
        text += `${args[i]} `;
    }

    var roles = new Array(numRoles);
    var emojis = new Array(numRoles);

    const filter = m => m.author.id === message.author.id;
    message.channel.send(":white_check_mark: Ok! Wpisz teraz po kolei wszystkie role i emoji odpowiadające im (układ: <@rola> <emoji>).\nJeżeli się pomylisz lub będziesz chciał anulować dodawanie RR, wprowadź **cancel**.\nMasz 2 minuty czasu, potem dodawanie RR wygaśnie!")
    message.channel.awaitMessages(filter, {
        max: numRoles,
        time: 120000
    }).then(collected => {
        for(var i = 0; i < numRoles; i++) {
            if(collected[i] === "cancel") {
                return message.channel.send(":x: Anulowano!");
            }
        }
    });
}

module.exports.config = {
    name: "createRR",
    aliases: ["newRR", "addRR", "rr"],
    description: "Tworzy nową wiadomość typu reaction roles. Dostępne tylko dla administratorów!",
    bigDesc: "Tworzy nową wiadomość typu reaction roles. Dostępne tylko dla administratorów! Użycie komendy: **/createRR <kanal> <ileRól> <tresc>**"
}