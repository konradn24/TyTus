const Discord = require('discord.js');
const colors = require('../colors.json');

const defaultPointsForTask = 2;

module.exports.run = async (bot, message, args, database) => {
    if(!message.member.hasPermission("ADMINISTRATOR")) return message.channel.send("Nie masz uprawnień do użycia tej komendy (ADMINISTRATOR)!");

    if(!args[0]) return message.channel.send("Określ dla kogo jest to zadanie! Jeżeli potrzebujesz pomocy, wprowadź **/help addTask**.");
    else if(!args[1]) return message.channel.send("Ustal termin wykonania zadania (dni do końca)! Jeżeli potrzebujesz pomocy, wprowadź **/help addTask**.");
    else if(!args[2]) return message.channel.send("Podaj treść zadania! Jeżeli potrzebujesz pomocy, wprowadź **/help addTask**.");
    else if(isNaN(parseInt(args[1])) || parseInt(args[1]) < 0) return message.channel.send("Niewłaściwy termin wykonania zadania! Musi być to liczba większa lub równa 0");

    var role = "false";
    let member = message.mentions.members.first(); if(!member) { role = "true"; member = message.mentions.roles.first(); }
    var time = args[1];
    var points = defaultPointsForTask; if(!isNaN(parseInt(args[2]))) points = parseInt(args[2]);
    var text = "";
    if(points === defaultPointsForTask) {
        for(var i = 2; i < args.length; i++) {
            text += `${args[i]} `;
        }
    } else {
        for(var i = 3; i < args.length; i++) {
            text += `${args[i]} `;
        }
    }

    message.delete();

    database.query(`SELECT * FROM tasks ORDER BY id DESC`, (err, rows) => {
        if(err) {
            console.log("Adding task error: " + err);
            return message.channel.send("Wystąpił błąd (1)!").then(msg => {
                msg.delete(5000);
            });
        }

        var taskTime;
        switch(time) {
            case "0": {
                taskTime = "Do dziś";
                break;
            }

            case "1": {
                taskTime = "Do jutra";
                break;
            }

            case "7": {
                taskTime = "Tydzień";
                break;
            }

            case "14": {
                taskTime = "Dwa tygodnie";
                break;
            }

            case "29": {
                taskTime = "Miesiąc";
                break;
            }

            case "30": {
                taskTime = "Miesiąc";
                break;
            }

            case "31": {
                taskTime = "Miesiąc";
                break;
            }

            default:
                taskTime = `${time} dni`;
        }

        var index;
        if(rows.length < 1) index = 1;
        else index = rows[0].id + 1;

        database.query(`INSERT INTO tasks VALUES(NULL, "${text}", ${time}, ${points}, "${member.id}", "${role}", "nie", "")`, console.log);
        var task = `**Zadanie ${index} dla ${member}**: ${text}\n**Termin:** ${taskTime}\n**Wykonano:** nie`;
        message.channel.send(task);
    });
}

module.exports.config = {
    name: "addTask",
    aliases: ["newTask", "giveTask", "taskFor"],
    description: "Daje zadanie dla administracji. Dostępne tylko dla administratorów!",
    bigDesc: "Daje zadanie dla administracji, a po jego wykonaniu dana osoba otrzymuje określoną ilość punktów (jeżeli ilość punktów za zadanie nie będzie określona to osoba dostanie domyślną ilość punktów, czyli 2). Dostępne tylko dla administratorów! Użycie komendy: **/addTask <@osoba/@ranga> <dniDoKonca> <opcjonalnaIloscPunktow> <tresc>**"
}