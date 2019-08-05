const Sequelize = require('sequelize');
const cheerio = require('cheerio');
const puppeteer = require('puppeteer');
const fetch = require('node-fetch')

class Scrape {
    constructor() {
        var self = this;
        self.dialect = 'sqlite';
        self.storage = './cached_scrape.sqlite';
        self.sitename = '';


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
            ttl: {
              type: Sequelize.STRING,
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

    getSite(){
      
    }

    isExpired() {
      var self = this;

    }

    siteExists() {
      var self = this;
      return new Promise((resolve, reject) => { 
        self.sites.findAll({
          where: {
            sitename: self.sitename
          }
        }).then(function(result){
          resolve(result.length > 0 ? true:false);
        })
      })
    }

    setSiteName(str) {
      this.sitename = str
      return this;
    }
}

module.exports = Scrape