const express = require('express');
const app = express();
const TelegramBot = require('node-telegram-bot-api');
const bodyParser = require('body-parser');
const axios = require("axios");
const _ = require("lodash");

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

require('dotenv').config();

const token = process.env.TELEGRAM_TOKEN;
let bot;

app.listen(process.env.PORT);
app.post('/' + token, (req, res) => {
  bot.processUpdate(req.body);
  res.sendStatus(200);
});

if (process.env.NODE_ENV === 'production') {
  bot = new TelegramBot(token);
  bot.setWebHook(process.env.HEROKU_URL + bot.token);
} else {
  bot = new TelegramBot(token, { polling: true });
}

const getTranslationFromApi = (wordObject) => {
  try {
    return axios({
      "method":"GET",
      "url":process.env.RAPIDAPI_URL,
      "headers":{
      "content-type":"application/octet-stream",
      "x-rapidapi-host":process.env.RAPIDAPI_HOST,
      "x-rapidapi-key":process.env.RAPIDAPI_KEY
      },"params":{
      "source": _.get(wordObject, 'source', 'es'),
      "target": _.get(wordObject, 'target', 'en'),
      "input": _.get(wordObject, 'word', '')
      }
    })
    .then((response)=>{
      return response.data.outputs;
    })
    .catch((error)=>{
      return false;
    })
  } catch (error) {
    return false;
  }
}

const getTranslation = async (wordObject) => {
  const translationFromApi = await getTranslationFromApi(wordObject);
  if(_.get(translationFromApi[0], 'stats.nb_tus_failed')){
    return false;
  } else if (_.get(translationFromApi[0], 'output')) {
    return translationFromApi[0].output;
  } else {
    return false;
  }
};

bot.onText(/\/ta (.+)/, async (msg, match) => {
  const chatId = msg.chat.id;
  const wordOrigin = match[1];

  console.log('palabra entrante ->', wordOrigin);

  const params = {
    source: 'es',
    target: 'en',
    word: wordOrigin
  };

  const wordTrans = await getTranslation(params);
  console.log('palabra traducida ->', wordTrans);
  if(!wordTrans) {
    bot.sendMessage(chatId, 'No van las traducciones, intentalo más tarde :) Miau', { parse_mode: 'HTML' });
  } else {
    bot.sendMessage(chatId, wordTrans, { parse_mode: 'HTML' });
  }
});
