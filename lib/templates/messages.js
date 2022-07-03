//Text
exports.text = (text, params = { contextInfo: undefined }) => ({
  text,
  ...params,
});

//Image
exports.imageBuffer = (
  image,
  params = { caption: undefined, viewOnce: false }
) => ({ image, ...params });
exports.imageUrl = (
  image,
  params = { caption: undefined, viewOnce: false }
) => ({ image: { url: image }, ...params });

//Video
exports.videoBuffer = (video, params = { gifPlayback: false }) => ({
  video,
  ...params,
});
exports.videoUrl = (video, params = { gifPlayback: false }) => ({
  video: { url: video },
  ...params,
});

//Audio
exports.audioBuffer = (audio, params = { mimetype: null, ptt: false }) => ({
  audio,
  ...params,
});
exports.audioUrl = (audio, params = { mimetype: null, ptt: false }) => ({
  audio: { url: audio },
  ...params,
});

//Sticker
exports.stickerBuffer = (sticker) => ({ sticker });
exports.stickerUrl = (sticker) => ({ sticker: { url: sticker } });

//Errors
exports.error = { text: "Ocurrio un error." };
exports.errorOldMessage = {
  text: "Ocurrio un error, puede que estes intentando convertir un mensaje muy antiguo.",
};
exports.errorNoMedia = {
  text: "Este comando debe adjuntarse a un archivo multimedia.",
};
exports.errorOnlyImages = { text: "Solo se permiten imagenes." };
exports.errorOnlyStickers = { text: "Solo se permiten stickers." };
exports.errorNoResults = { text: "No se encontraron resultados." };
exports.errorNoSongName = { text: "Ingrese el nombre de alguna cancion." };
exports.errorNoSong = {
  text: "No se encontro ninguna cancion con ese nombre.",
};
exports.errorNoVideoName = { text: "Ingrese el nombre de algun video." };
exports.errorNoVideo = { text: "No se encontro ningun video con ese nombre." };
exports.errorSendQuestion = { text: "Preguntame algo, no seas tan timido." };
exports.errorCharacterName = { text: "Ingrese el nombre de algun personaje." };
exports.errorCharacterId = { text: "Ingrese el id de algun personaje." };
exports.erroOnlyAdmins = {
  text: "Solo los administradores pueden usar este comando.",
};
exports.errorOnlyGroup = {
  text: "Este comando solo esta disponible en grupos.",
};
exports.errorBotAdmin = {
  text: "El bot necesita permisos de administrador para ejecutar este comando.",
};
exports.errorNoUsersTagAll = { text: "No hay usuarios para tagall." };
