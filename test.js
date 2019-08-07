var Scrape = require('./src/scrape')


var scrape = new Scrape();
/*
scrape.setSiteName('www.instagram.com/mkhairul').siteExists().then(function(result){
    console.log(result)
});
*/
scrape.setSiteName('https://www.instagram.com/tv3malaysia').startScraping().then(function(page){
  console.log('Done:', page);
})


const {PubSub} = require('@google-cloud/pubsub');

async function quickstart(
  projectId = 'goldenorb', // Your Google Cloud Platform project ID
  topicName = 'scraping' // Name for the new topic to create
) {
  // Instantiates a client
  const pubsub = new PubSub({projectId});

  // Creates the new topic
  // const [topic] = await pubsub.createTopic(topicName);
  // console.log(`Topic ${topic.name} created.`);
  var message = {
    sitename: 'mkhairul.com',
    // TODO: retrieve rules list based on domain
  };

  const dataBuffer = Buffer.from(JSON.stringify(message));
  const messageId = await pubsub.topic(topicName).publish(dataBuffer);
  console.log(`Message ${messageId} published.`);
}

//quickstart();