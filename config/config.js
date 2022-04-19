require("dotenv").config();
module.exports = {
  prefix: process.env.prefix || "!", //Your bot prefix example: "!" 
  BgApikey: process.env.BgApikey || "", //Your Bg Api key (https://api.remove.bg/v1.0/removebg) 
};
