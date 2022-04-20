const moment = require("moment-timezone");

const ping = (kurisu) => {
  const time = require("moment-timezone")
    .duration(moment() - moment(kurisu.messageTimeStamp * 1000))
    .asSeconds();
  return { text: `🏓 PONG! • speed: ${time}ms` };
};

module.exports = ping;
