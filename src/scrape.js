const Sequelize = require('sequelize');
const cheerio = require('cheerio');
const puppeteer = require('puppeteer');
const fetch = require('node-fetch')

class Scrape {
    constructor(){
        var self = this;
        self.dialect = 'sqlite';
        self.storage = './cached_scrape.sqlite';


        self.db = new Sequelize({
            dialect: self.dialect,
            storage: self.storage
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
}

module.exports = Scrape