const express = require('express');
const emojis = require('./emojis');
const igscraper = require('../../index')
const check_db = require('../check_db')

const router = express.Router();

router.get('/', (req, res) => {
  res.json({
    message: 'API - 👋🌎🌍🌏'
  });
});

//router.use('/emojis', emojis);

router.get('/iginfo', (req, res) => {
  
  check_db()
  .then((row) => {
    
    res.json({'message':row})
  })
  .catch((msg) => {
    res.json({'message':msg})
  })
});

module.exports = router;
