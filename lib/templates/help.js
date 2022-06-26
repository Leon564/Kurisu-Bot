const { prefix } = require("../../config");
const { version } = require("../../package.json");

exports.menu = (data) => {
  let sections = [];
  data.commands.map((command, i) => {
    if (!sections.find((c) => c.title === command.category)) {
      return sections.push({
        title: command.category,
        rows: [
          {
            title: prefix + command.command,
            rowId: `${prefix}help ${command.command}`,
            description: "",
          },
        ],
      });
    }
    sections
      .find((s) => s.title === command.category)
      .rows.push({
        title: prefix + command.command,
        rowId: `${prefix}help ${command.command}`,
        description: "",
      });
  });

  const listMessage = {
    title: "Kurisu-Bot",
    text: `Selecciona una opcion en el menu a continuacion para ver los detalles\nTambien puedes usar ${prefix}help <<comando>>`,
    footer: `V-${version} by Leon564®`,
    buttonText: "Comandos",
    sections,
  };

  return listMessage;
};

exports.command = (data, scommand) => {
  const result = data.commands.find(
    (command) =>
      command.command === scommand.toLowerCase() ||
      prefix + command.command === scommand.toLowerCase()
  );
  return result
    ? {
        text: `${prefix}${result.command}\n\n${result.about}\n\n*Uso:* ${result.usage}`,
      }
    : { text: `No se encontro el comando *${scommand}*` };
};
