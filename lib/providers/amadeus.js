const { fetchJson } = require("fetch-json");
const ApiUrl = "http://amadeus-api.herokuapp.com/api";

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
      if (anime.results) return anime.results[0];
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
    .get("http://amadeus-api.herokuapp.com/api/phrase")
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
    .get("http://amadeus-api.herokuapp.com/api/meme")
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
};