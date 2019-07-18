const cheerio = require('cheerio');
const puppeteer = require('puppeteer');
const fetch = require('node-fetch')

function scrape()
{
    const url = 'https://www.instagram.com/tv3malaysia/';

    async function getPostDetails(postid){
        let response = await fetch('https://api.instagram.com/oembed/?url=http://instagr.am/'+postid)
        let json_data = await response.json();
        return json_data;
    }

    return puppeteer
        .launch()
        .then(browser => browser.newPage())
        .then(page => {
            return page.goto(url).then(function(){
                return page.content();
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

            return new Promise((resolve, reject) => {
                Promise.all(promises).then(values => {
                    values.forEach(function(item){
                        page.posts.push(item)
                    })

                    if(process.env.NODE_ENV !== 'production')
                    {
                        //console.log(page)
                    }
                    resolve(page)
                    process.exit()
                })
            })
        })
        .catch(console.error)
}

module.exports = scrape;