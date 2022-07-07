const { prefix, version } = require("../../config");

const messageTemplate = (character) => ({
  image: { url: character.image.image_url },
  caption:
    "\n*Nombre:* " + character.name + "\n*Descripción* \n" + character.about,
});

const messageListTemplate = (characters) => {
  let rows = characters.map((x) => ({
    title: x.name,
    rowId: prefix + "characterid " + x.id,
  }));
  return {
    title: "\t\t\t\t\t\t\t\t\t\t\t\t\t\t\tResultados",
    text: `Selecciona una opcion en el menu a continuacion para ver los detalles del personaje.`,
    footer: `Kurisu-BotV${version} by Leon564`,
    buttonText: "Personajes",
    sections: [{ title: "Resultados", rows }],
  };
};

module.exports = {
  messageTemplate,
  messageListTemplate,
};
