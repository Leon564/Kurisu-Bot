//Text
exports.text = (text,contextInfo) => ({ text, contextInfo });

//Image
exports.imageBuffer = (image,caption,viewOnce) => ({ image, caption, viewOnce });
exports.imageUrl = (image,caption,viewOnce) => ({ image: { url: image }, caption, viewOnce });

//Video
exports.videoBuffer = (video,gifPlayback) => ({ video, gifPlayback });
exports.videoUrl = (video,gifPlayback) => ({ video: { url: video }, gifPlayback });

//Audio
exports.audioBuffer = (audio,mimetype) => ({ audio, mimetype});
exports.audioUrl = (audio,mimetype) => ({ audio: { url: audio }, mimetype });

//Sticker
exports.stickerBuffer = (sticker) => ({ sticker });
exports.stickerUrl = (sticker) => ({ sticker: { url: sticker } });

//Errors
exports.error = { text: "Ocurrio un error." };
exports.errorOldMessage = {
  text: "Ocurrio un error, puede que estes intentando convertir un mensaje muy antiguo.",
};
exports.errorNoMedia = { text: "Este comando debe adjuntarse a un archivo multimedia." };
exports.errorOnlyImages = { text: "Solo se permiten imagenes." };
exports.errorOnlyStickers = { text: "Solo se permiten stickers." };
exports.errorNoResults = { text: "No se encontraron resultados." };
exports.errorNoSongName = { text: "Ingrese el nombre de alguna cancion." };
exports.errorSendQuestion = { text: "Preguntame algo, no seas tan timido." };
exports.errorCharacterName = { text: "Ingrese el nombre de algun personaje." };
exports.errorCharacterId = { text: "Ingrese el id de algun personaje." };
exports.erroOnlyAdmins = { text: "Solo los administradores pueden usar este comando." };
exports.errorOnlyGroup = { text: "Este comando solo esta disponible en grupos." };
exports.errorBotAdmin = { text: "El bot necesita permisos de administrador para ejecutar este comando." };
exports.errorNoUsersTagAll = { text: "No hay usuarios para tagall." };
