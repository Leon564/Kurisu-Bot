const makeWASocket = require("@adiwajshing/baileys");

const userIsAdmin = async (kurisu) => {
  if (!kurisu.participant || !kurisu.isGroup) return false;
  const metadata = await kurisu.groupMetadata(kurisu.from);

  var isAdmin = metadata.participants.find(
    (x) => x.id == kurisu.participant && x.admin
  );
  return isAdmin ? true : false;
};
const botIsAdmin = async (kurisu) => {
  if (!kurisu.participant || !kurisu.isGroup) return false;
  const metadata = await kurisu.groupMetadata(kurisu.from);
  var isAdmin = metadata.participants.find(
    (x) => x.id == kurisu.botId && x.admin
  );

  return isAdmin ? true : false;
};

module.exports = {
  userIsAdmin,
  botIsAdmin,
};
