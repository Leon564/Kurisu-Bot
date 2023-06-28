import "dotenv/config";

const config = {
  prefix: process.env.PREFIX || "!",
  openAiApiKey: process.env.OPENAI_API_KEY,
};

export default config;
