const templates = require("../../templates");
const commands = require("../../../data/commands.json");
const help = (kurisu) => {
  if (kurisu?.args[0]) return templates.help.command(commands, kurisu.args[0]);
  return templates.help.menu(commands);
};

module.exports = help;
