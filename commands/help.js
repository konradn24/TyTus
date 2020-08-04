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
            .addField("stats-role", "Ilość osób posiadających daną rolę (np. ile osób jest w zarządzie, czyli ma rolę @Zarząd) (WKRÓTCE)", false)
            .addField("stats-bots", "Ilość botów na serwerze (WKRÓTCE)", false)
            .addField("stats-humans", "Ilość członków serwera wyłączając boty (WKRÓTCE)", false)
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
        .setDescription("Wprowadź */help <komenda>*, żeby więcej się o niej dowiedzieć. Mój prefiks: **/**\n**/help configs** - pokazuje nazwy ustawień konfiguracyjnych serwera\n**/help stats** - pokazuje spis dostępnych statystyk\n\n\n")
        .addField("**MODERACJA\n⚊⚊⚊**", "ban - banuje określonego użytkownika\n\nmute - Wycisza członka serwera poprzez nadanie mu roli określonej w */config muteRole <@muted>*\n\nunmute - Przywraca możliwość pisania\n ", false) //MODERACJA
        .addField("**POZIOMY ZA AKTYWNOŚĆ\n⚊⚊⚊**", "level - wyświetla aktualny poziom i aktulną ilość doświadczenia\n\naddLevel - dodaje użytkownikowi określoną ilość poziomów\n\nreduceLevel - redukuje podaną ilość poziomów użytkownika\n\nleaderboard - wyświetla ranking 10 najaktywniejszych osób\n\nresetLevels - resetuje wszystkim członkom serwera doświadczenie i poziomy, nie da się tego cofnąć!", false) //POZIOMY ZA AKTYWNOŚĆ
        .addField("**ADMINISTRACJA\n⚊⚊⚊**", "addTask - daje zadanie dla administracji, czyli dla wszystkich osób z podaną rolą lub dla jednej konkretnej osoby\n\nadminPoints - pokazuje uzbieraną ilość punktów za zadania\n\naddPoints - przyznaje administratorowi dodatkowe punkty\n\nreducePoints - odejmuje administratorowi punkty\n\nadminRank - wyświetla ranking najlepszych administratorów", false) //ADMINISTRACJA
        .addField("**STATYSTYKI SERWEROWE\n⚊⚊⚊**", "createStats - automatycznie tworzy kanały ze statystykami, można podać, których kanałów bot ma NIE tworzyć\n\nsetStats - przypisuje podaną statystykę do podanego kanału\n\nsetStatsChannelName - zmienia nazwę kanału (np. z 'członkowie: {}' na '{} osób jest na serwerze') do którego przypisana jest podana statystyka", false) //STATYSTYKI SERWEROWE
        .addField("**INNE\n⚊⚊⚊**", "createRR - tworzy wiadomość reaction roles\n\nconfig - zmienia ustawienia konfiguracyjne na serwerze\n\nshowConfig - pokazuje na co aktualnie jest ustawiona podana opcja\n\ntest - sprawdza stan bota, jeżeli odpowie - wszystko jest w porządku\n\nbotinfo - pokazuje informacje o bocie TyTus", false) //INNE
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