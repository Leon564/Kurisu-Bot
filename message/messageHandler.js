const makeWASocket = require("@adiwajshing/baileys");
const sorter = require("./sorter");

module.exports = async (m, conn) => {
  let kurisu = { ...conn, ...sorter(m) };
  if (!kurisu.isCommand) return;

  const botId = kurisu.user.id.includes(":")
    ? kurisu.user.id.split(":")[0] + "@s.whatsapp.net"
    : kurisu.user.id;
};
