const makeWASocket = require("@adiwajshing/baileys");
const sorter = require("./sorter");
const { commands } = require("../lib");

module.exports = async (m, conn) => {
  let kurisu = { ...conn, ...sorter(m) };
  if (!kurisu.isCommand) return;

  kurisu.botId = kurisu.user.id.includes(":")
    ? kurisu.user.id.split(":")[0] + "@s.whatsapp.net"
    : kurisu.user.id;

  switch (kurisu.command) {
    //hola
    case "hola":
    case "hello":
    case "hi":
      await kurisu.sendMessage(kurisu.from, commands.greetings.greeting(), {
        quoted: m,
      });
      break;

    //stickers
    case "sticker":
    case "stiker":
      await kurisu.sendMessage(
        kurisu.from,
        await commands.stickers.stickermaker(kurisu),
        {
          quoted: m,
        }
      );
      break;
    case "doge":
      await kurisu.sendMessage(
        kurisu.from,
        await commands.stickers.doge(),
        {
          quoted: m,
        }
      );
      break;

    case "img":
    case "image":
      await kurisu.sendMessage(
        kurisu.from,
        await commands.stickers.stickerToImage(kurisu),
        {
          quoted: m,
        }
      );
      break;
    case "gif":
      await kurisu.sendMessage(
        kurisu.from,
        await commands.stickers.stickerToGif(kurisu),
        {
          quoted: m,
        }
      );
      break;
    //memes
    case "meme":
      await kurisu.sendMessage(kurisu.from, await commands.fun.meme(), {
        quoted: m,
      });
      break;

    //frase
    case "frase":
    case "f":
      await kurisu.sendMessage(kurisu.from, await commands.fun.phrase(), {
        quoted: m,
      });
      break;
    //hub
    case "hub":
      await kurisu.sendMessage(kurisu.from, await commands.fun.hub(kurisu), {
        quoted: m,
      });
      break;

    //8ball
    case "8ball":
      await kurisu.sendMessage(kurisu.from, await commands.fun.ball8(kurisu), {
        quoted: m,
      });
      break;

    //roll
    case "roll":
      await kurisu.sendMessage(kurisu.from, await commands.fun.rollDice(), {
        quoted: m,
      });
      break;
  }
};
