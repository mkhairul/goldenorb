const Sequelize = require('sequelize');
const cheerio = require('cheerio');
const puppeteer = require('puppeteer');
const fetch = require('node-fetch');
const moment = require('moment');
const filenamify = require('filenamify');
const {PubSub} = require('@google-cloud/pubsub');
const fs = require('fs');

class Scrape {
    constructor() {
        var self = this;
        self.dialect = 'sqlite';
        self.storage = './cached_scrape.sqlite';
        self.sitename = '';

        self.projectid = 'goldenorb';
        self.pubsub = {};
        self.pubsub.topic = 'scraping';

        self.site = {};

        self.db = new Sequelize({
            dialect: self.dialect,
            storage: self.storage,
            logging: false
        })
        var sequelize = self.db

        const Model = Sequelize.Model;
        class Sites extends Model{}
        Sites.init({
            // attributes
            sitename: {
              type: Sequelize.TEXT,
            },
            expired: {
              type: Sequelize.DATE,
            },
            cached_filename: {
              type: Sequelize.TEXT
            },
            status: {
              type: Sequelize.TEXT
            }
        }, {
            sequelize,
            modelName: 'sites'
            // options
        });
        self.db.sync();

        self.sites = Sites;
    }

    getSite() {
      var self = this;
      return new Promise((resolve, reject) => {
        self.siteExists().then((exists) => {
          if(exists) { 
            console.log('record exists');
            // Check if the record is expired
            self.isExpired().then(function(expired){
              if(expired === false)
              {
                // Retrieve cached site data
                fs.readFile('./cached/' + self.site.cached_filename, function(err, data){
                  console.log(process.cwd())
                  if (err) throw err;
                  var site_data = JSON.parse(data);
                  site_data.status = 1;
                  resolve(site_data);
                })
              } else {
                var expirydate = moment().add(2, 'hours').toDate();
                self.site.expiry = expirydate;
                self.site.status = 0;
                self.site.save().then(function(){
                  var message = {
                    sitename: self.site.sitename,
                  };
                  console.log(message);
                  self._publishMessage(JSON.stringify(message)).then(() => {
                    resolve(self.site.status)
                  });
                })
              }
            })
          } else {
            // Save Data in DB
            // Generate Message
            // Publish message to cloud pub/sub
            // return ID to user
            var expirydate = moment().add(2, 'hours').toDate();
            var filename = filenamify(self.sitename, {replacement:'_'}) + '.json';

            self.sites.create({
              sitename: self.sitename,
              expired: expirydate,
              cached_filename: filename,
              status: 0,
            }).then(site => {
              // Generate message to publish
              var message = {
                sitename: self.sitename,
                // TODO: retrieve rules list based on domain
              };
              self._publishMessage(JSON.stringify(message)).then(() => {
                resolve(site.status)
              });
            })
          }
        })
      })
    }

    listenForMessages (subscriptionName) {
      // Handling process exit
      // Ref: https://stackoverflow.com/questions/14031763/doing-a-cleanup-action-just-before-node-js-exits
      function exitHandler(options, exitCode) {
        console.log('exiting..')
        if (options.cleanup) console.log('clean');
        if (exitCode || exitCode === 0) console.log(exitCode);
        if (options.exit) process.exit();
      } 

      //do something when app is closing
      process.on('exit', exitHandler.bind(null,{cleanup:true}));
      //catches ctrl+c event
      process.on('SIGINT', exitHandler.bind(null, {exit:true}));
      // catches "kill pid" (for example: nodemon restart)
      process.on('SIGUSR1', exitHandler.bind(null, {exit:true}));
      process.on('SIGUSR2', exitHandler.bind(null, {exit:true}));
      //catches uncaught exceptions
      process.on('uncaughtException', exitHandler.bind(null, {exit:true}));

      var self = this;
      console.log('Listening for messages..');

      const pubsub = new PubSub(self.projectid);
      const subscription = pubsub.subscription(subscriptionName, { flowControl: 
        { 
          maxMessages: 1,
          allowExcessMessages: false
        } 
      });

      const messageHandler = message => {
        var msg_json = JSON.parse(message.data);
        console.log('Start scraping:', msg_json.sitename);
        self.setSiteName(msg_json.sitename).startScraping().then(function(){
          console.log('Scrape completed:', self.sitename)
          message.ack();
        })
      }

      subscription.on(`message`, messageHandler);
    }

    async _publishMessage(msg) {
      var self = this;
      const pubsub = new PubSub(self.projectid);
      //await pubsub.createTopic(self.sitename);

      const dataBuffer = Buffer.from(msg);
      console.log(self.pubsub);
      const messageId = await pubsub.topic(self.pubsub.topic).publish(dataBuffer);
      console.log(`Message ${messageId} published.`);
    }

    startScraping() {
      var self = this;

      return new Promise((resolve, reject) => {
        self.sites.findAll({
          where: {
            sitename: self.sitename
          }
        }).then(function(result){

          var filename = (result.length > 0) ? result[0].cached_filename:filenamify(self.sitename, {replacement:'_'})

          self._scrapeSite().then((data) => {
            var site_row = result[0];
            site_row.status = 1;
            site_row.save().then(function(){
              // Create/update file, save data to file
              fs.writeFileSync('./cached/' + filename, JSON.stringify(data));
              resolve(true)
            })
          })
        })
      })
    }

    async _scrapeSite() {
      var self = this;

      async function getPostDetails(postid){
        let response = await fetch('https://api.instagram.com/oembed/?url=http://instagr.am/'+postid)
        let json_data = await response.json();
        return json_data;
      }

      return new Promise(async(resolve, reject) => {

        const browser = await puppeteer.launch({
          headless: true,
          args: ['--no-sandbox', '--disable-setuid-sandbox']
        });
        try{ 
          const browser_page = await browser.newPage();
          await browser_page.goto(self.sitename);
          const html = await browser_page.content();
    
          const $ = cheerio.load(html);
          const page = {}
    
          page.logo = {
              'img': $('main > div > header > div img').first().attr('src'),
              'alt': $('main > div > header > div img').first().attr('alt'),
          }
          page.title = $('section > div:first-child h1').first().text();
          page.verified = $('section > div:first-child span').first().text();
    
          const info_list = ['posts', 'followers', 'following']
          page.info = {};
          $('section > ul li').each(function(index){
              page.info[info_list[index]] = $('a > span', this).first().text()
          })
    
          page.description = $('section > :nth-child(3)').first().html();
    
          page.posts = [];
          let promises = [];
          $('main article > div:first-child > div > div').each(function(){
              $('> div', this).each(function(){
                  let post_url = $('a', this).first().attr('href');
                  let post_data = getPostDetails(post_url)
                  promises.push(post_data);
              })
          })
    
          Promise.all(promises).then(async(values) => {
            values.forEach(function(item){
                page.posts.push(item)
            })
            await browser.close();
            resolve(page)
          })
        } catch (error) {
          console.log(error);
          await browser.close();
        } finally {
          await browser.close();
        }
      });


      /*
      return new Promise((resolve, reject) => {
        puppeteer
          .launch({
            headless: true,
            args: ['--no-sandbox', '--disable-setuid-sandbox']
          })
          .then(browser => browser.newPage())
          .then(page => {
            return page.goto(self.sitename).then(function(){
              return page.content()
            })
          })
          .then(html => {
            const $ = cheerio.load(html);
            const page = {}

            page.logo = {
                'img': $('main > div > header > div img').first().attr('src'),
                'alt': $('main > div > header > div img').first().attr('alt'),
            }
            page.title = $('section > div:first-child h1').first().text();
            page.verified = $('section > div:first-child span').first().text();

            const info_list = ['posts', 'followers', 'following']
            page.info = {};
            $('section > ul li').each(function(index){
                page.info[info_list[index]] = $('a > span', this).first().text()
            })

            page.description = $('section > :nth-child(3)').first().html();

            page.posts = [];
            let promises = [];
            $('main article > div:first-child > div > div').each(function(){
                $('> div', this).each(function(){
                    let post_url = $('a', this).first().attr('href');
                    let post_data = getPostDetails(post_url)
                    promises.push(post_data);
                })
            })

            Promise.all(promises).then(values => {
              values.forEach(function(item){
                  page.posts.push(item)
              })
              resolve(page)
            })
          })
          .catch(console.error)
      })
      */
    }

    isExpired() {
      var self = this;
      return new Promise((resolve, reject) => { 
        self.sites.findAll({
          where: {
            sitename: self.sitename
          }
        }).then(function(result){
          self.site = result[0];
          var expired = moment(self.site.expired);
          var current = moment().utc();
          var diff = expired.diff(current, 'minutes');
          if(diff > 0)
          {
            // not expired
            resolve(false);
          }
          else
          {
            resolve(true);
          }
        })
      })
    }

    siteExists() {
      var self = this;
      return new Promise((resolve, reject) => { 
        self.sites.findAll({
          where: {
            sitename: self.sitename
          }
        }).then(function(result){
          self.site = result[0];
          resolve(result.length > 0 ? true:false);
        })
      })
    }

    setSiteName(str) {
      this.sitename = str;
      //this.pubsub.topic = str;
      return this;
    }

    setProjectId(str) {
      this.projectid = str;
      return this;
    }
}

module.exports = Scrape