const express = require('express');

const emojis = require('./emojis');

const igscraper = require('../../index')

const router = express.Router();

router.get('/', (req, res) => {
  res.json({
    message: 'API - 👋🌎🌍🌏'
  });
});

router.use('/emojis', emojis);

router.get('/iginfo', (req, res) => {
  res.json(igscraper());
  /*
  igscraper().then(function(data){
    res.json(data);
  })
  */
});

module.exports = router;
