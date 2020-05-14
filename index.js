const Discord = require('discord.js');
const colors = require('./colors.json');
const package = require('./package.json');
let xp = require('./xp.json');
// const superagent = require('superagent');
const bot = new Discord.Client({disableEveryone: true});

const experiencePerMessage = 5;

const prefix = "/";
const version = 0.1;

const databaseServer = "TyTus Bot Database"; //IMPORTANT
const databaseChannel = "experience-database"; //IMPORTANT
const logsChannel = "logs"; //IMPORTANT
const enableInitlevels = true;

bot.on('ready', async () => {
    console.log("Jestem aktywny!");
    bot.user.setActivity(`v${package.version} | /help`, {type: "WATCHING"});
});

const fs = require('fs');
bot.commands = new Discord.Collection();
bot.aliases = new Discord.Collection();

fs.readdir('./commands/', (err, files) => {
    if(err) console.log(err)
    let jsfile = files.filter(f => f.split(".").pop() === "js")
    if(jsfile.length <= 0) return console.log('Error: cannot find commands!');

    jsfile.forEach((f, i) => {
        let pull = require(`./commands/${f}`);
        bot.commands.set(pull.config.name, pull);
        pull.config.aliases.forEach(alias => {
            bot.aliases.set(alias, pull.config.name)
        });
    });
});

var interval = 0;

bot.on('message', async message =>{
    if(message.author.bot || message.channel.type === "dm") return;

    var dbGuild = bot.user.client.guilds.find("name", databaseServer);
    var dbChannel = dbGuild.channels.find("name", databaseChannel);
    var lgChannel = dbGuild.channels.find("name", logsChannel);
    if(!dbGuild) return console.log("Can't get to database server!");
    if(!dbChannel) return console.log("Can't get to database channel!");

    if(!xp[message.author.id]) {
        xp[message.author.id] = {
            xp: 0,
            level: 1
        };
    }

    xp[message.author.id].xp = xp[message.author.id].xp + experiencePerMessage;
    let nextLevel = xp[message.author.id].level * 50;

    if(nextLevel <= xp[message.author.id].xp) {
        var lastXp = xp[message.author.id].xp;
        var lastLevel = xp[message.author.id].level;
        xp[message.author.id].xp = 0;
        xp[message.author.id].level = xp[message.author.id].level + 1;
        dbChannel.send(xp);
        fs.writeFile("./xp.json", JSON.stringify(xp), (err) => {
            if(err) {
                lgChannel.send(`Cannot rewrite **xp.json** file while adding next level (${message.author.username} / ${message.author.id}, ${lastXp}, ${lastLevel}). Error:\n${err}`);
                xp[message.author.id].xp = lastXp;
                xp[message.author.id].level = lastLevel;
            }
        });
    }

    if(message.content.startsWith(prefix)) {
        let messageArray = message.content.split(" ");
        let cmd = messageArray[0];
        let args = messageArray.slice(1);

        let commandFile = bot.commands.get(cmd.slice(prefix.length)) || bot.commands.get(bot.aliases.get(cmd.slice(prefix.lenght)))
        if(commandFile) commandFile.run(bot, message, args);

        // if(cmd.slice(prefix.length) === "initlevels" && enableInitlevels) {
        //     var amount = 0;

        //     // message.guild.members.forEach(m => {
        //     //     var isOnList = false;

        //     //     dbChannel.fetchMessages().then(messages => {
        //     //         messages.array().forEach(mg => {
        //     //             if(mg.content.startsWith(m.user.username)) isOnList = true;
        //     //         });
        //     //     });

        //     //     if(isOnList === false) {
        //     //         dbChannel.send(`${m.user.username} 0`);
        //     //     }

        //     //     amount++;
        //     // });

        //     message.guild.members.forEach(m => {
        //         if(m.user.username != "konradn24") {
        //             dbChannel.send(`${m.user.username} 0`);
        //             amount++;
        //         }
        //     });

        //     message.channel.send(`Utworzono licznik punktów za wiadomości dla następującej liczby użytkowników: **${amount}**.`);
        //     lgChannel.send(`Utworzono licznik punktów za wiadomości dla następującej liczby użytkowników: **${amount}**. Serwer: **${message.guild.name}**.`);
        // } else if(cmd.slice(prefix.length) === "initlevels" && !enableInitlevels) {
        //     message.channel.send(`Liczniki puktów zostały już stworzone dla każdego użytkownika!`);
        //     lgChannel.send(`Użytkownik **${message.author.username}** próbował zainicjować liczniki puktów! Serwer: **${message.guild.name}**`);
        // }
    }

    // if(interval === 2) interval = 0;
    // if(interval === 1) interval++;

    // if(message.guild.name === databaseServer) return;

    // var lastExp = 0;

    // dbChannel.fetchMessages().then(messages => {
    //     messages.array().forEach(m => {
    //         if(m.content.startsWith(message.author.username)) {
    //             lastExp = m.content.split(" ").slice(1);
    //             lastExp++;
    //             m.delete();
    //             m.channel.send(`${message.author.username} ${lastExp}`);
    //         }
    //     });
    // });
});

setInterval(function(){
    fs.writeFile("./xp.json", JSON.stringify(xp), (err) => {
        if(err) lgChannel.send(`Cannot rewrite **xp.json** file in *setInterval* function (Timestamp: ${Date.now()}). Error:\n${err}`);
    });
}, 10000);

bot.login('NjkxMjkxMTc2NDQ3Mzc3NDEx.Xr1WuA.vlnQ3folaLuRMoxoAhxJ1d29r3o');
