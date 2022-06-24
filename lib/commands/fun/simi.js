const { fetchJson } = require("fetch-json");
const { messages } = require("../../templates");

const simi = async (kurisu) => {
  if (!kurisu.outCommandMessage || kurisu.outCommandMessage.length < 1)
    return messages.errorSendQuestion;
  const result = await fetchJson.get(
    `https://api.simsimi.net/v2/?text=${encodeURI(kurisu.outCommandMessage)}&lc=es`
  );
  return messages.text(result.success);
};

module.exports = simi;
