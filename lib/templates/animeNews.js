const { prefix } = require("../../config");
const tools = require("../tools");

const messageTemplate = async (news) => {  
  return {
    image: await tools.imageDownloadAndResize(news.mainImage),
    caption: `*${news.title}*\n\n${news.news}${
      news.videos.length > 0 ? "\n\nVideo:" + news.videos[0].url : ""
    }\n\n${news.post}`,
  };
};

const messageListTemplate = (news) => {
  let rows = news.results.map((x) => ({
    title: x.title,
    rowId: prefix + "newsid " + x.id,
  }));

  return {
    title: "\t\t\t\t\t\t\t\t\t\t\t\t\t\t\tResultados",
    text: `Selecciona una opcion en el menu a continuacion para ver los detalles de la noticia.`,
    footer: "Kurisu-BotV2.0.0 by Leon564",
    buttonText: "Noticias Anime",
    sections: [{ title: "Resultados", rows }],
  };
};

module.exports = {
  messageTemplate,
  messageListTemplate,
};
