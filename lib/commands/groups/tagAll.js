const makeWASocket = require("@adiwajshing/baileys");
const { userIsAdmin } = require("../../tools").groups;
const tagall = async (kurisu) => {
  if (!kurisu.isGroup)
    return { text: "Este comando solo funciona en chats grupales." };
  if (!(await userIsAdmin(kurisu)))
    return { text: "Solo los administradores pueden usar este comando." };
  const metadata = await kurisu.groupMetadata(kurisu.from);
  let users = "";
  let usersId = metadata.participants
    .map((x) => {
      if (x.id != kurisu.botId && x.id != kurisu.participant) {
        users += `@${x.id.split("@")[0]} `;
        return x.id;
      }
      return null;
    })
    .filter((x) => x != null);
  if (usersId.length == 0) return { text: "No hay usuarios para tagall" };
  return { text: users, contextInfo: { mentionedJid: usersId } };
};
module.exports = tagall;
