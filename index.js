const express = require('express');
const app = express();
const bodyParser = require('body-parser');
const axios = require("axios");

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

app.get('/', (req, res) => {
  res.send('hi there :)');
});

app.listen(process.env.PORT, () => {
  console.log('Listening :) ');
});

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

app.post('/translate', async (req, res) => {
  const params = req.body;
  if (!params.word){
    return res.status(422).send('No word');
  }

  const translation = await getTranslation(params)
  res.send(translation);
});