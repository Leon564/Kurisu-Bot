const makeWASocket = require("@adiwajshing/baileys");
const { messages } = require("../../templates");
const { userIsAdmin } = require("../../tools").groups;

const tagall = async (kurisu) => {
  if (!kurisu.isGroup)
    return messages.errorOnlyGroup;
  if (!(await userIsAdmin(kurisu)))    
    return messages.erroOnlyAdmins;
  const metadata = await kurisu.groupMetadata(kurisu.from);
  let users = "";
  const usersId = metadata.participants
    .map((x) => {
      if (x.id != kurisu.botId && x.id != kurisu.participant) {
        users += `@${x.id.split("@")[0]} `;
        return x.id;
      }
      return null;
    })
    .filter((x) => x != null);
  if (usersId.length == 0) return messages.errorNoUsersTagAll;
  return messages.text(users,{mentionedJid: usersId});  
};
module.exports = tagall;
