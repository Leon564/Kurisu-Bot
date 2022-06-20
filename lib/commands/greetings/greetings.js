const greets =require('../../../data/greetings.json');
const { messages } = require('../../templates');
const greeting = () => {  
  return messages.text(greets[Math.floor(Math.random() * greets.length)]);
}

module.exports = {greeting};