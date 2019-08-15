const express = require('express');
const emojis = require('./emojis');
const igscraper = require('../../index')
const check_db = require('../check_db')
const Scrape = require('../scrape');

const router = express.Router();

router.get('/', (req, res) => {
  res.json({
    message: 'API - 👋🌎🌍🌏'
  });
});

//router.use('/emojis', emojis);

router.get('/iginfo/:igname', (req, res) => {
  /*
  check_db()
  .then((row) => {
    res.json({'message':row})
  })
  .catch((msg) => {
    res.json({'message':msg})
  })
  */
  var scrape = new Scrape();
  scrape.setSiteName('https://www.instagram.com/' + req.params.igname).getSite().then(function(result){
    res.json(result);
  })
  //res.json({'status': req.params.igname})
});

module.exports = router;
