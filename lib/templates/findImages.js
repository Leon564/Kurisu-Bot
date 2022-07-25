const { prefix, version } = require("../../config");

const imagesByTextResults = (results) => {
  let rows = results.map((x) => ({
    title: x.title,
    rowId: prefix + "imagelink " + x.url,
  }));
  return {
    title: "\t\t\t\t\t\t\t\t\t\t\t\t\t\t\tResultados",
    text: `Selecciona una opcion en el menu a continuacion para ver la imagen.`,
    footer: `Kurisu-BotV${version} by Leon564`,
    buttonText: "Imagenes",
    sections: [{ title: "Resultados", rows }],
  };
};
const imagesByLinkResults = (results) => {
  let rows = results
    .map((x) => ({
      title: x.title,
      description: x.url,
      rowId: x.url,
    }));
  return {
    title: "\t\t\t\t\t\t\t\t\t\t\t\t\t\t\tResultados",
    text: `Selecciona una opcion en el menu a continuacion para verla en detalle.`,
    footer: `Kurisu-BotV${version} by Leon564`,
    buttonText: "Resultados",
    sections: [{ title: "Resultados", rows }],
  };
};

module.exports = { imagesByTextResults, imagesByLinkResults };
