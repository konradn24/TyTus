const Discord = require('discord.js')
const colors = require('../colors.json');

var started = false;

module.exports.run = async (bot, message, args, database) => {
    if((!args[0] && !started) || (args[0] === "YES" && !started)) {
        started = true;
        return message.channel.send(":grey_question: Wpisz **/resetLevels YES** jeżeli jesteś pewny, że chcesz to zrobić. Jeżeli nie chcesz, to wprowadź **/resetLevels NO** lub **/resetLevels**. UWAGA: ZRESETOWANIA PUNKTÓW I POZIOMÓW DLA WSZYSTKICH UŻYTKOWNIKÓW PRZEWAŻNIE NIE DA SIĘ COFNĄĆ!!!");
    }

    if((!args[0] && started) || (args[0] === "NO" && started)) {
        started = false;
        return message.channel.send(":x: Anulowano resetowanie punktów i poziomów za aktywność.");
    }

    if(args[0] === "YES" && started) {
        started = false;
        database.query(`UPDATE members SET xp = 0`, (err, rows) => {
            if(err) {
                console.log(err);
                return message.channel.send(":x: Podczas resetu wystąpił nieoczekiwany błąd (1)! Spróbuj ponownie później.");
            }

            database.query(`UPDATE members SET level = 1`, (err, rows) => {
                if(err) {
                    console.log(err);
                    return message.channel.send(":x: Podczas resetu wystąpił nieoczekiwany błąd (2)! Spróbuj ponownie później.");
                }

                database.query(`UPDATE members SET totalXp = 0`, (err, rows) => {
                    if(err) {
                        console.log(err);
                        return message.channel.send(":x: Podczas resetu wystąpił nieoczekiwany błąd (3)! Spróbuj ponownie później.");
                    }
    
                    message.channel.send(":white_check_mark: Pomyślnie zresetowano punkty i poziomy dla wszystkich osób w bazie danych!");
                });
            });
        });
    }
}

module.exports.config = {
    name: "resetLevels",
    aliases: ["rLevels", "resetPointsForActivity"],
    description: "Resetuje punkty i poziomy za aktywność dla wszystkich użytkowników zapisanych w bazie danych. __UWAGA: NIE MOŻNA TEGO COFNĄĆ!!!__.",
    bigDesc: "Resetuje punkty i poziomy za aktywność dla wszystkich użytkowników zapisanych w bazie danych. __UWAGA: NIE MOŻNA TEGO COFNĄĆ!!!__."
}