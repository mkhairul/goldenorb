const {PubSub} = require('@google-cloud/pubsub');
const Scrape = require('./scrape');

var scrape = new Scrape();
scrape.listenForMessages('scrapingprocessor');