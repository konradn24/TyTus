const Discord = require('discord.js');
const mysql = require('mysql');
const colors = require('./colors.json');
const package = require('./package.json');
let xp = require('./xp.json');
// const superagent = require('superagent');
const bot = new Discord.Client({disableEveryone: true});

const experiencePerMessage = 5;

const prefix = "/";
const version = 0.1;

const tasksChannelID = "670227462655049728";
const guildID = "553913839108882432";

const databaseServer = "TyTus Bot Database"; //IMPORTANT
const databaseChannel = "experience-database"; //IMPORTANT
const logsChannel = "logs"; //IMPORTANT
const database = mysql.createPool({
    host: '85.10.205.173',
    user: 'tytus_dev',
    password: 'tytusadmin',
    database: 'tytus_bot_db'
});

database.getConnection((err, connection) => {
    if(err) {
        console.log(`There was an error while connecting to database, try changing host on 85.10.205.173 or db4free.net. ${err}`);
        throw 'Closing program: cannot connect to database!';
    } else {
        database.config.timeout = 30000;
        console.log("Connected to MySQL!");
    }
});

bot.on('ready', async () => {
    console.log("Jestem aktywny!");
    bot.user.setActivity(`v${package.version} | /help`, {type: "WATCHING"});

    //Fetching tasks messages
    bot.guilds.find('id', guildID).channels.find('id', tasksChannelID).fetchMessages();
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

    var currentXp = -1, currentLevel = 0, currentTotalXp;
    database.query(`SELECT * FROM config WHERE id = 3`, (errC, rowsC) => {
        if(errC) return console.log(errC);

        if(rowsC[0].value === "false") return;

        database.query(`SELECT * FROM members WHERE discordID = "${message.author.id}"`, (err, rows) => {
            if(err || rows === undefined) return console.log(err);

            let sql;
            if(rows.length < 1) {
                sql = `INSERT INTO members VALUES(NULL, "${message.author.id}", "${message.author.username}", ${experiencePerMessage}, 1, ${experiencePerMessage})`;
            } else {
                currentXp = rows[0].xp;
                currentLevel = rows[0].level;
                currentTotalXp = rows[0].totalXp;
                sql = `UPDATE members SET xp = ${currentXp + experiencePerMessage} WHERE discordID = "${message.author.id}"`;
                database.query(`UPDATE members SET totalXp = ${currentTotalXp + experiencePerMessage} WHERE discordID = "${message.author.id}"`);

                if(rows[0].username != message.author.username) database.query(`UPDATE members SET username = "${message.author.username}" WHERE discordID = "${message.author.id}"`);
            }

            database.query(sql, (err, results) => {
                var nextLevel = currentLevel * 50;
                if(nextLevel <= currentXp) {
                    database.query(`UPDATE members SET xp = 0 WHERE discordID = "${message.author.id}"`, console.log);
                    database.query(`UPDATE members SET level = ${currentLevel + 1} WHERE discordID = "${message.author.id}"`, console.log);

                    database.query(`SELECT * FROM config WHERE id = 1 OR id = 2`, (err, rows) => { //IMPORTANT !!! config named msgOnLevelUp has id 1, sendMsgOnLevelUp has id 2
                        if(err) return console.log(err);
                        if(rows[1].value === "true") {
                            var text = rows[0].value;
                            text = text.replace('{user}', `${message.guild.members.find("id", message.author.id)}`);
                            text = text.replace('{level}', `${currentLevel + 1}`);
                            message.channel.send(`${text}`);
                        }
                    });
                }
            });
        });
    });

    if(message.content.startsWith(prefix)) {
        let messageArray = message.content.split(" ");
        let cmd = messageArray[0];
        let args = messageArray.slice(1);

        let commandFile = bot.commands.get(cmd.slice(prefix.length)) || bot.commands.get(bot.aliases.get(cmd.slice(prefix.lenght)))
        if(commandFile) commandFile.run(bot, message, args, database);

        if(cmd.slice(prefix.length) === "SQL_initTable") {
            var date = new Date();

            if(message.author.id != "485062530629107746") {
                lgChannel.send(`User **${message.author.username}** tried to use **sqlInitTable** command on server **${message.guild.name}** at **${date}** (database table **members** __wasn't__ initiated).`);
                return message.channel.send(":x: Nie możesz użyć tej funkcji.");
            }

            message.channel.send(":white_check_mark: Ok!");
            for(var i = 0; i < message.guild.memberCount; i++) {
                let sql = `INSERT INTO members VALUES(NULL, "${message.guild.members.array()[i].user.id}", "${message.guild.members.array()[i].user.username}", 0, 1)`;
                let query = database.query(sql, (err, result) => {
                    if(err) console.log(err);
                    console.log(result);
                });
            }

            lgChannel.send(`User **${message.author.username}** used **SQL_initTable** command on server **${message.guild.name}** at **${date}** (database table **members** was __successfully__ initiated).`);
        }
    }
});

bot.on("messageReactionAdd", async (reaction, member) => {
    if(reaction.message.channel.id === tasksChannelID && reaction.emoji.name === "👍") {
        let msgContent1 = reaction.message.content.split(': ');
        if(msgContent1.length > 2) {
            for(var i = 2; i < msgContent1.length; i++) {
                msgContent1[1] += ":" + msgContent1[i]; 
            }
        }

        var msgContent2 = msgContent1[1].split(" |");
        var msgContentFinal = msgContent2[0];

        var index = reaction.message.content.substr(10, 2);
        console.log(index);

        try {
        database.query(`SELECT * FROM tasks WHERE id="${index}"`, (err, rows) => {
            if(err) {
                return console.log("Database 1 error: " + err);
            }

            var role = rows[0].role;

            //When server owner clicks reaction "👍"
            if(member.id === "334361003498405889") { //TiTi98_pl's ID IMPORTANT
                if(rows[0].made === "tak" || rows[0].made_by === "") return; //If it's currently accepted or nobody made it, then return

                //Updating task content
                var taskFor;
                if(role === "false") { //When task was for one person
                    taskFor = reaction.message.mentions.members.first();
                    reaction.message.edit(`**Zadanie ${rows[0].id} dla ${taskFor}**: ${rows[0].text}\n**Wykonano!** :white_check_mark:`);
                } else { //When task was for role
                    taskFor = reaction.message.mentions.roles.first();
                    reaction.message.edit(`**Zadanie ${rows[0].id} dla ${taskFor}**: ${rows[0].text}\n**Wykonano przez ${reaction.message.guild.members.find('id', rows[0].made_by).user.username}!** :white_check_mark:`);
                }

                //Updating task's "made" param in database
                database.query(`UPDATE tasks SET made="tak" WHERE id=${rows[0].id}`, console.log);

                //Adding points
                var madeBy = reaction.message.guild.members.find('id', rows[0].made_by);
                madeBy.send(`Przyznano Ci ${rows[0].points} punktów za wykonanie zadania!`);

                database.query(`SELECT * FROM administration WHERE discordID="${madeBy.id}"`, (err1, rows1) => {
                    if(err1) {
                        return console.log("Database 2 error: " + err1);
                    }

                    //If any user with this ID does not exist, add him to database
                    if(rows1.length < 1) return database.query(`INSERT INTO administration VALUES(NULL, "${madeBy.id}", ${rows[0].points})`);

                    //if there is user with this ID, update "points" param
                    database.query(`UPDATE administration SET points=${rows1[0].points + rows[0].points} WHERE discordID="${madeBy.id}"`, console.log);
                });
            //When any other user clicks reaction
            } else {
                if(rows[0].made_by != "") return; //If someone has already made this task, then return

                //Check if the task is for one person or role
                var taskFor;
                if(role === "false") taskFor = reaction.message.mentions.members.first();
                else taskFor = reaction.message.mentions.roles.first();

                if(role === "false") { //When task is for one person
                    if(member.id != taskFor.id) return; //If person that clicked reaction don't have to make this task, then return

                    reaction.message.edit(`**Zadanie ${rows[0].id} dla ${taskFor}**: ${rows[0].text} |\n**Wykonano:** tak (niepotwierdzone :thinking:) |`);

                    //Set task's param "made_by" to the ID of user that clicked reaction
                    database.query(`UPDATE tasks SET made_by="${taskFor.id}" WHERE id=${rows[0].id}`, console.log);
                } else {
                    if(!reaction.message.guild.members.find('id', `${member.id}`).roles.find('id', taskFor.id)) return; //If this person doesn't have specified role, then return
                    
                    reaction.message.edit(`**Zadanie ${rows[0].id} dla ${taskFor}**: ${rows[0].text} |\n**Wykonano przez:** ${member.username} (niepotwierdzone :thinking:) |`);
                
                    //Set task's param "made_by" to the ID of user that clicked reaction
                    database.query(`UPDATE tasks SET made_by="${member.id}" WHERE id=${rows[0].id}`, console.log);
                }
            }
        });
        } catch(e) {
            console.log(e);
            reaction.message.channel.send("Wystąpił błąd!").then(msg => {
                msg.delete(10000);
            });
        }
    }
});

bot.login('NjkxMjkxMTc2NDQ3Mzc3NDEx.Xr1WuA.vlnQ3folaLuRMoxoAhxJ1d29r3o');
