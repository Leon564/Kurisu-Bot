const makeWASocket = require("@adiwajshing/baileys");

const userIsAdmin = async (kurisu) => {
  const metadata = await kurisu.groupMetadata(kurisu.from);
  if (!kurisu.participant) return false;
  var isAdmin = metadata.participants.find(
    (x) => x.id == kurisu.participant && x.admin
  );
  return isAdmin ? true : false;
};

module.exports = {
  userIsAdmin,
};
