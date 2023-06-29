import { OpenAIApi, Configuration } from "openai";
import { MessageData, SendData } from "../../shared/interfaces/types";
import config from "../../shared/infrastructure/configs/app.config";
import { getOpenaiWhiteList } from "../services/firebase.service";

const chatGPT = async (data: MessageData): Promise<SendData> => {
  try {
    const whiteList = await getOpenaiWhiteList();
    if (!whiteList.includes(data.message.userNumber)) {
      return {
        type: "text",
        text: "no tienes permiso para usar este comando",
        quoted: true,
        reacttion: "❎",
      };
    }

    const configuration = new Configuration({
      apiKey: config.openAiApiKey,
    });
    const openai = new OpenAIApi(configuration);
    const result = await openai.createChatCompletion({
      n: 1,
      model: "gpt-3.5-turbo",
      messages: [
        { role: "system", content: "soy un bot, me llamo Kurisu" },
        { role: "system", content: "solo dare respuestas muy cortas" },
        {
          role: "system",
          content: "me expreso como Makise Kurisu de la serie steins;gate",
        },
        { role: "user", content: data.message.outCommandMessage || "" },
      ],
    });
    return {
      type: "text",
      text: result.data.choices[0]?.message?.content || "no se que decir",
      quoted: true,
      reacttion: "🤖",
    };
  } catch (err) {
    console.log(err);
    throw err;
  }
};

export default chatGPT;
