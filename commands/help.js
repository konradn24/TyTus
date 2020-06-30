const Discord = require('discord.js')
const colors = require('../colors.json');

module.exports.run = async (bot, message, args, database) => {
    if(args[0]) {
        if(args[0] === "configs") {
            database.query(`SELECT * FROM config`, (err, rows) => {
                if(err) return console.log(err);
                var embed = new Discord.RichEmbed()
                .setTitle("TyTus - wszystkie dostępne ustawienia")
                .setDescription("**/showConfig <nazwaUstawienia>**, żeby wyświetlić aktualną wartość dla danego ustawienia. \n **/config <nazwaUstawienia> <wartosc>**, żeby zmienić wybrane ustawienie. \n \n")
                .setFooter("Discord TyTus Bot © 2020");
                for(var i = 0; i < rows.length; i++) {
                    var values;
                    switch(rows[i].allowedValues) {
                        case "number": {
                            values = "liczba";
                            break;
                        }
                        case "boolean": {
                            values = "true / false";
                            break;
                        }
                        case "channel": {
                            values = "kanał";
                            break;
                        }
                        case "role": {
                            values = "rola";
                            break;
                        }
                        case "channelname": {
                            values = "nazwa kanału";
                            break;
                        }
                        case "ALL": {
                            values = "wszystko (tekst, liczby)";
                            break;
                        }
                        default: {
                            values = "nie określono";
                            break;
                        }
                    }
                    // text += `\`${rows[i].name}\` - ${rows[i].description} Dopuszczalne wartości: *${values}*.\n\n`;
                    embed.addField(rows[i].name, `${rows[i].description} Dopuszczalne wartości: *${values}*`, true);
                }

                return message.channel.send(embed);
            });
        }

        if(args[0] === "stats") {
            var embed = new Discord.RichEmbed()
            .setTitle("TyTus - statystyki serwera Discord")
            .setDescription("**/createStats** - automatycznie tworzy kanały dla statystyk\n**/config <statystyka (lista poniżej)> <nazwa kanału>** - przypisuje kanał do podanej statystyki\n**/statsInfo** - wyświetla listę aktualnie używanych na serwerze statystyk i ich kanały oraz statystyki, które są gotowe do użycia\n\n")
            .addField("stats-members", "Ilość użytkowników na serwerze", false)
            .addField("stats-new", "Nowy użytkownik (ten który ostatnio dołączył)", false)
            .addField("stats-online (WKRÓTCE)", "Ilość członków online", false)
            .addField("stats-bestonline (WKRÓTCE)", "Rekord aktywnych osób w tym samym momencie", false)
            .addField("stats-date", "Aktualna data (DD.MM.YYYY, np. 19.05.2020)", false)
            .addField("stats-time", "Godzina (HH:MM, np. 21:37)", false)
            .addField("stats-role", "Ilość osób posiadających daną rolę (np. ile osób jest w zarządzie, czyli ma rolę @Zarząd)", false)
            .addField("stats-bots", "Ilość botów na serwerze", false)
            .addField("stats-humans", "Ilość członków serwera wyłączając boty", false)
            .setFooter("Discord TyTus Bot © 2020");

            return message.channel.send(embed);
        }

        let command = args[0];
        if(bot.commands.has(command)) {
            command = bot.commands.get(command);
            // var bhembed = new Discord.MessageEmbed()
            // .setColor(colors.red_dark)
            // .setAuthor('TyTus Bot Pomoc', message.guild.iconURL)
            // .setDescription(`**Polecenie:** ${command.config.name}\n**Opis:** ${command.config.bigDesc || "Brak opisu."}`)
            // message.channel.send(bhembed);

            var text = `**Polecenie:** ${command.config.name}\n**Opis:** ${command.config.bigDesc}`;
            message.channel.send(text);
        }
    } else {
        var embed = new Discord.RichEmbed()
        .setColor(colors.red_light)
        .setTitle("TyTus - na ratunek")
        .setDescription("Wprowadź */help <komenda>*, żeby więcej się o niej dowiedzieć. Mój prefiks: **/**\n**/help configs** - pokazuje nazwy ustawień konfiguracyjnych serwera\n**/help stats** - pokazuje informacje o statystykach\n\n")
        .addField("**MODERACJA**", "⚊⚊⚊", false) //MODERACJA
        .addField("ban", "Banuje określonego użytkownika", true)
        .addField("mute", "Wycisza członka serwera poprzez nadanie mu roli określonej w */config muteRole <@muted>*", true)
        .addField("unmute", "Przywraca możliwość pisania", true)
        .addField("**POZIOMY ZA AKTYWNOŚĆ**", "⚊⚊⚊", false) //POZIOMY ZA AKTYWNOŚĆ
        .addField("level", "Wyświetla aktualny poziom i aktulną ilość doświadczenia", true)
        .addField("addLevel", "Dodaje użytkownikowi określoną ilość poziomów", true)
        .addField("reduceLevel", "Redukuje podaną ilość poziomów użytkownika", true)
        .addField("leaderboard", "Wyświetla ranking 10 najaktywniejszych osób", true)
        .addField("resetLevels", "Resetuje wszystkim członkom serwera doświadczenie i poziomy, nie da się tego cofnąć!", true)
        .addField("**ADMINISTRACJA**", "⚊⚊⚊", false) //ADMINISTRACJA
        .addField("addTask", "Daje zadanie dla administracji, a konkretnie dla wszystkich osób z podaną rolą lub dla jednej określonej osoby", true)
        .addField("adminPoints", "Pokazuje uzbieraną ilość punktów za zadania", true)
        .addField("addPoints", "Przyznaje administratorowi dodatkowe punkty", true)
        .addField("reducePoints", "Usuwa administratorowi punkty za wykonane zadania", true)
        .addField("adminRank", "Wyświetla ranking najlepszych administratorów", true)
        .addField("**INNE**", "⚊⚊⚊", false) //INNE
        .addField("createRR", "Tworzy wiadomość reaction roles", true)
        .addField("config", "Zmienia ustawienia konfiguracyjne na serwerze", true)
        .addField("showConfig", "Pokazuje na co aktualnie jest ustawiona podana opcja", true)
        .addField("test", "Sprawdza stan bota, jeżeli odpowie - wszystko jest w porządku", true)
        .addField("botinfo", "Pokazuje informacje o bocie TyTus", true)
        .setFooter("Discord TyTus Bot © 2020");


        message.channel.send(embed);
    }
}

module.exports.config = {
    name: "help",
    aliases: ["pomoc", "info", "commands"],
    description: "Wyświetla wszystkie polecenia i ich opisy. Wprowadź nazwę komendy po **/help**, żeby zobaczyć jej dokładny opis (przykład: **/help ban**).",
    bigDesc: "Wyświetla wszystkie polecenia i ich opisy. Wprowadź nazwę komendy po **/help**, żeby zobaczyć jej dokładny opis (przykład: **/help ban**)."
}