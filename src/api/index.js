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
  

  db.serialize(function(){
    db.run('CREATE TABLE IF NOT EXISTS sites (sitename TEXT, ttl TEXT, cached_filename TEXT)')

    var stmt = db.prepare("SELECT * FROM sites WHERE sitename = ?");
    
  })

  // Check the DB if there exists a cached page
  // If there is, check the TTL of the entry
  // If its more than 1 hour, rescrape the page

  //res.json(igscraper());
  /*
  igscraper().then(function(data){
    res.json(data);
  })
  */
});

module.exports = router;
