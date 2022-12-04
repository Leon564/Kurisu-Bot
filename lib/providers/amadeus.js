const { fetchJson } = require("fetch-json");
const ApiUrl = "https://amadeus.onrender.com/api";

//Movies
const movieByName = async (name) => {
  if (!name) return null;
  return fetchJson
    .get(`${ApiUrl}/movie?q=${name}`)
    .then((movie) => {
      if (movie.error || movie.total_results == 0) return null;
      return movie;
    })
    .catch((err) => {
      console.log(err);
      return null;
    });
};
const movieById = async (id, type) => {
  if (!id || !type) return null;
  return fetchJson
    .get(`${ApiUrl}/movie?id=${id}&type=${type}`)
    .then((movie) => {
      if (movie.error || movie.total_results == 0) return null;
      return movie.results[0];
    })
    .catch((err) => {
      console.log(err);
      return null;
    });
};

//Animes
const animeByName = async (name) => {
  if (!name) return null;
  return fetchJson
    .get(`${ApiUrl}/anime/search?q=${name}`)
    .then((anime) => {
      if (anime.error || anime.total_results == 0) return null;
      return anime;
    })
    .catch((err) => {
      console.log(err);
      return null;
    });
};

const animeById = async (id) => {
  if (!id) return null;
  return fetchJson
    .get(`${ApiUrl}/anime/search?id=${id}`)
    .then((anime) => {
      if (anime.error || anime.total_results == 0) return null;
      return anime.results[0];
    })
    .catch((err) => {
      console.log(err);
      return null;
    });
};
const randomAnime = async () => {
  return fetchJson
    .get(`${ApiUrl}/anime`)
    .then((anime) => {
      if (anime?.results[0]) return anime.results[0];
      return null;
    })
    .catch((err) => {
      console.log(err);
      return null;
    });
};

//Characters
const characterByName = async (name) => {
  if (!name) return null;
  return fetchJson
    .get(`${ApiUrl}/anime/character?name=${name}`)
    .then((characters) => {
      if (characters.error) return null;
      return characters;
    })
    .catch((err) => {
      console.log(err);
      return null;
    });
};

const characterById = async (id) => {
  if (!id) return null;
  return fetchJson
    .get(`${ApiUrl}/anime/character/${id}`)
    .then((character) => {
      if (character.error) return null;
      return character;
    })
    .catch((err) => {
      console.log(err);
      return null;
    });
};

//Phrase
const phrase = async () => {
  return await fetchJson
    .get(`${ApiUrl}/phrase`)
    .then((phrase) => {
      if (phrase.error) return null;
      return phrase.phrase;
    })
    .catch((err) => {
      console.log(err);
      return null;
    });
};

//Meme
const meme = async () => {
  return fetchJson
    .get(`${ApiUrl}/meme`)
    .then((meme) => {
      if (!meme.url) return null;
      return meme.url;
    })
    .catch((err) => {
      console.log(err);
      return null;
    });
};

//Webpage screanshot
const webShot = async (url, fullpage) => {
  const result = await fetchJson.get(`${ApiUrl}/ws?url=${url}`);
  if (result.error) return null;
  return fullpage
    ? `${ApiUrl}/ws?url=${url}&full_page=true`
    : `${ApiUrl}/ws?url=${url}`;
};

//News
const animeNews = async () => {
  return fetchJson
    .get(`${ApiUrl}/news/anime`)
    .then((news) => {
      if (news.error) return null;
      return news;
    })
    .catch((err) => {
      console.log(err);
      return null;
    });
};
const animeNewsById = async (id) => {
  return fetchJson
    .get(`${ApiUrl}/news/anime?id=${id}`)
    .then((news) => {
      if (news.error) return null;
      return news;
    })
    .catch((err) => {
      console.log(err);
      return null;
    });
};

//Stickers

const doge = async () => {
  const result = await fetchJson.get(`${ApiUrl}/sticker/doge`);
  if (result.error) return null;
  return result.image;
};

const snime = async () => {
  const result = await fetchJson.get(`${ApiUrl}/sticker/anime`);
  if (result.error) return null;
  return result.image;
};

const waifu_Sfw = async () => {
  const result = await fetchJson.get(`${ApiUrl}/sfw/waifu`);
  if (result.error || !result?.result?.url) return null;
  return {
    image: result.result.images[0].url,
    name: result.result.images[0].tags[0].name,
  };
};

waifu_Nfsw = async () => {
  const result = await fetchJson.get(`${ApiUrl}/nfsw/waifu`);
  if (result.error || !result?.result?.url) return null;
  return { image: result.result.url, name: result.result.title };
};

husb_Sfw = async () => {
  const result = await fetchJson.get(`${ApiUrl}/sfw/husb`);
  if (result.error || !result?.result?.url) return null;
  return { image: result.result.url, name: result.result.title };
};

husb_Nfsw = async () => {
  const result = await fetchJson.get(`${ApiUrl}/nfsw/yaoi`);
  if (result.error || !result?.result?.url) return null;
  return { image: result.result.url, name: result.result.title };
};

findImage = async (q) => {
  const result = await fetchJson.get(`${ApiUrl}/image/search?q=${q}`);
  if (result.error) return null;
  return result.results;
}
findByImage = async (url) => {
  const result = await fetchJson.get(`${ApiUrl}/image/similarly?url=${url}`);
  if (result.error) return null;
  return result.results;
}


module.exports = {
  movieByName,
  movieById,
  animeByName,
  animeById,
  randomAnime,
  characterByName,
  characterById,
  phrase,
  meme,
  webShot,
  animeNews,
  animeNewsById,
  doge,
  snime,
  waifu_Sfw,
  husb_Sfw,
  waifu_Nfsw,
  husb_Nfsw,
  findImage,
  findByImage,
};
