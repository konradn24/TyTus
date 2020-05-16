const Discord = require('discord.js')
const colors = require('../colors.json');

module.exports.run = async (bot, message, args, database) => {
    var member;

    if(!args[0]) member = message.guild.members.find("id", `${message.author.id}`);
    else member = message.mentions.members.first();

    database.query(`SELECT * FROM config WHERE id = 3`, (errC, rowsC) => {
        if(errC) {
            console.log(errC);
            return message.channel.send(":x: Wystąpił błąd podczas łączenia się z bazą danych (config). Spróbuj ponownie później.");
        }

        if(rowsC[0].value === "false") return message.channel.send(":x: Nie możesz zobaczyć swojego poziomu, ponieważ poziomy za aktywność są wyłączone.");

        database.query(`SELECT * FROM members WHERE discordID = ${member.user.id}`, (err, rows) => {
            if(err) {
                console.log(err);
                return message.channel.send(":x: Wystąpił błąd podczas łączenia się z bazą danych (1). Spróbuj ponownie później.");
            }

            if(rows < 1) return message.channel.send(":x: Nie znaleziono Cię w bazie danych. Jeżeli jesteś nowym członkiem serwera, zostaniesz wkrótce dodany do bazy danych. Jeśli jesteś już jakiś czas na serwerze i wysłałeś na nim conajmniej kilka wiadomości to skontaktuj się z zarządem serwera (najlepiej z osobą która ma rolę \"Server Technician\"; może być to spowodowane błędem w bazie danych).");
        
            database.query(`SELECT * FROM members ORDER BY totalXp DESC`, (err1, rows1) => {
                if(err1) {
                    console.log(err1);
                    return message.channel.send(":x: Wystąpił błąd podczas łączenia się z bazą danych (2). Spróbuj ponownie później.");
                }

                var rank = rows1.length + 1;
                for(var i = 0; i < rows1.length; i++) {
                    if(rows1[i].discordID === `${member.id}`) rank = i + 1;
                }

                var nextLevel = rows[0].level * 50;
                message.channel.send(`\`STAN AKTYWNOŚCI DLA ${member.displayName}\` \n Punkty doświadczenia: **${rows[0].xp}** / **${nextLevel}** (**${Math.floor(rows[0].xp / nextLevel * 100)}%**) \n Poziom: **${rows[0].level}** \n Miejsce w rankingu: **#${rank}**`);
            });
        });
    });
}

module.exports.config = {
    name: "level",
    aliases: ["myLevel", "points", "myPoints"],
    description: "Pokazuje obecny poziom, ilość punktów za aktywność i pozycję w rankingu na serwerze.",
    bigDesc: "Pokazuje obecny poziom, ilość punktów za aktywność i pozycję w rankingu na serwerze. Jeżeli po **/level** nie będzie określonego użytkownika to zostaną pokazane statystyki dla osoby wywołującej polecenie. Użycie: **/level <@opcjonalnieOsoba>**"
}