const { prefix, version } = require("../../config");
const buttonMessage = (videos, query) => {
  var buttons = videos.map((result) => ({
    buttonId: `${prefix}music ${result.url}`,
    buttonText: { displayText: result.title },
    type: 1,
  }));
  return {
    caption: `*Resultados para:* ${query}`,
    image: {
      url: videos[0].thumbnail,
    },
    buttons: buttons,
    footer: "Kurisu-WBot",
  };
};

const listMessage = (videos, query) => {
  console.log(videos);
  let rows = videos.map((x) => ({
    title: `${x.channel}`,
    rowId: prefix + "yt " + x.url,
    description: x.title,
  }));

  return {
    title: "Resultados para " + query,
    text: `Selecciona una opcion en el menu a continuacion para descargar el video.`,
    footer: `Kurisu-BotV${version} by Leon564`,
    buttonText: "videos",
    sections: [{ title: "Resultados", rows }],
  };
};

module.exports = { buttonMessage, listMessage };
