const {PubSub} = require('@google-cloud/pubsub');
const pubsub = new PubSub('goldenorb');

var message = {
    sitename: 'https://www.instagram.com/tv3malaysia',
};

const topic = 'scraping';

const dataBuffer = Buffer.from(JSON.stringify(message));
pubsub.topic(topic).publish(dataBuffer).then(messageId => {
    console.log(`Message ${messageId} published.`);
});