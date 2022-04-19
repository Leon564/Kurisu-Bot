const greets =require('../../../data/greetings.json');
const greeting = () => {
  
  return {text:greets[Math.floor(Math.random() * greets.length)]};
}

module.exports = {greeting};