# goldenorb

## Requirements
`sudo apt-get install libnss3-dev`
`sudo apt-get install libxss1`

`yarn add axios cheerio puppeteer node-fetch express sequelize moment @google-cloud/pubsub`

## Running the project

Setting up Google Cloud environment variable (for authentication)

`export GOOGLE_APPLICATION_CREDENTIALS="/var/www/goldenorb/goldenorb.json"`


For parallel testing of publishing messages and listening for messages.

`sudo apt-get install parallel`

`seq 1 3 | parallel -j 3 node test_publisher.js`