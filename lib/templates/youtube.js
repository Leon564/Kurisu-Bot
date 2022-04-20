const { prefix } = require("../../config");
const buttonMessage = (videos, query) => {
  var buttons = videos.map((result) => ({
    buttonId: `${prefix}music ${result.id}`,
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

module.exports = buttonMessage;
