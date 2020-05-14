const Discord = require('discord.js')
const colors = require('../colors.json');

module.exports.run = async (bot, message, args) => {
    message.channel.send("Siemka!");
}

module.exports.config = {
    name: "test",
    aliases: ["hi", "czesc"],
    description: "Sprawdza czy bot działa poprawnie (jeżeli odpowie, wszystko jest w porządku).",
    bigDesc: "Sprawdza czy bot działa - czy jest online, czy nie ma błędów, itp. (jeżeli są błędy, bot nie odpowiada)."
}