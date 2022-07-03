const sorter = require("./sorter");
const { commands } = require("../lib");
const makeWASocket = require("@adiwajshing/baileys");

module.exports = async (m, conn) => {
  let kurisu = { ...conn, ...sorter(m) };
  if (!kurisu.isCommand) return;

  kurisu.botId = kurisu.user.id.includes(":")
    ? kurisu.user.id.split(":")[0] + "@s.whatsapp.net"
    : kurisu.user.id;

  if (!m.key?.fromMe) {
    await kurisu.sendPresenceUpdate("composing", kurisu.from);
    await kurisu.sendReadReceipt(kurisu.from, m.key.participant, [m.key.id]);
  }

  switch (kurisu.command) {
    // help
    case "menu":
    case "help":
      await kurisu.sendMessage(kurisu.from, commands.help(kurisu), {
        quoted: m,
      });
      break;
    //hola
    case "hola":
    case "hello":
    case "hi":
      await kurisu.sendMessage(kurisu.from, commands.greetings.greeting(), {
        quoted: m,
      });
      break;

    case "ping":
      await kurisu.sendMessage(kurisu.from, commands.misc.ping(kurisu), {
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
    case "stickerbg":
    case "stikerbg":
      await kurisu.sendMessage(
        kurisu.from,
        await commands.stickers.stickerbg(kurisu),
        {
          quoted: m,
        }
      );
      break;
    case "doge":
      await kurisu.sendMessage(kurisu.from, await commands.stickers.doge(), {
        quoted: m,
      });
      break;

    case "snime":
      await kurisu.sendMessage(kurisu.from, await commands.stickers.snime(), {
        quoted: m,
      });
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

    //simi
    case "simi":
      await kurisu.sendMessage(kurisu.from, await commands.fun.simi(kurisu), {
        quoted: m,
      });
      break;

    //roll
    case "roll":
      await kurisu.sendMessage(kurisu.from, await commands.fun.rollDice(), {
        quoted: m,
      });
      break;

    //youtube
    case "music":
      await kurisu.sendPresenceUpdate("recording", kurisu.from);
      const result = await commands.youtube.youtubeToMp3(kurisu);
      await kurisu.sendMessage(kurisu.from, result[0], result[1]);
      await kurisu.sendMessage(kurisu.from, {
        react: { text: "🎶", key: m.key },
      });
      break;

    case "ms":
    case "musicsearch":
      await kurisu.sendMessage(
        kurisu.from,
        await commands.youtube.youtubeSearch.musicSearch(kurisu),
        {
          quoted: m,
        }
      );
      break;
    //youtube video downloader
    case "yt":
      await kurisu.sendMessage(
        kurisu.from,
        await commands.youtube.youtubeToMp4(kurisu),
        { quoted: m }
      );
      break;

    //anime
    case "anime":
      await kurisu.sendMessage(
        kurisu.from,
        await commands.anime.find.findAnime(kurisu),
        {
          quoted: m,
        }
      );
      break;
    case "animeid":
      await kurisu.sendMessage(
        kurisu.from,
        await commands.anime.find.animeById(kurisu),
        {
          quoted: m,
        }
      );
      break;
    case "character":
    case "ch":
      await kurisu.sendMessage(
        kurisu.from,
        await commands.anime.character.character(kurisu),
        {
          quoted: m,
        }
      );
      break;
    case "characterid":
      await kurisu.sendMessage(
        kurisu.from,
        await commands.anime.character.characterById(kurisu),
        {
          quoted: m,
        }
      );
      break;
    case "news":
      await kurisu.sendMessage(
        kurisu.from,
        await commands.anime.news.animeNews(kurisu),
        {
          quoted: m,
        }
      );
      break;
    case "newsid":
      await kurisu.sendMessage(
        kurisu.from,
        await commands.anime.news.newsById(kurisu),
        {
          quoted: m,
        }
      );
      break;

    //speech
    case "speech":
    case "say":
      await kurisu.sendMessage(
        kurisu.from,
        await commands.misc.speech(kurisu),
        {
          quoted: m,
        }
      );
      break;

    //lyrics
    case "lyrics":
    case "lyric":
      await kurisu.sendMessage(
        kurisu.from,
        await commands.misc.lyrics(kurisu),
        {
          quoted: m,
        }
      );
      break;
    //sfw
    case "waifu":
      await kurisu.sendMessage(kurisu.from, await commands.anime.sfw.waifu(), {
        quoted: m,
      });
      break;
    case "husb":
      await kurisu.sendMessage(kurisu.from, await commands.anime.sfw.husb(), {
        quoted: m,
      });
      break;
    //nfsw
    case "waifuh":
      await kurisu.sendMessage(kurisu.from, await commands.anime.nfsw.waifu(), {
        quoted: m,
      });
      break;
    case "husbh":
      await kurisu.sendMessage(kurisu.from, await commands.anime.nfsw.husb(), {
        quoted: m,
      });
      break;

    //webshots
    case "webshot":
    case "ws":
      await kurisu.sendMessage(
        kurisu.from,
        await commands.misc.webshots(kurisu),
        {
          quoted: m,
        }
      );
      break;

    //movies
    case "movie":
      await kurisu.sendMessage(
        kurisu.from,
        await commands.movie.movieByName(kurisu),
        {
          quoted: m,
        }
      );
      break;
    case "movieid":
      await kurisu.sendMessage(
        kurisu.from,
        await commands.movie.movieById(kurisu),
        {
          quoted: m,
        }
      );
      break;

    //Groups
    case "tagall":
      await kurisu.sendMessage(
        kurisu.from,
        await commands.groups.tagAll(kurisu),
        {
          quoted: m,
        }
      );
      break;

    //default return to default state
    default:
      await kurisu.sendPresenceUpdate("paused", kurisu.from);
      break;
  }
};
