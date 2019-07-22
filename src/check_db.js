var sqlite = require('sqlite3').verbose();
var argv = require('minimist')(process.argv.slice(2));

var db = new sqlite.Database('./cached_scrape.sqlite');

if(argv.hasOwnProperty('sitename') === false){ throw new Error('need --sitename'); }
var sitename = argv['sitename'];

db.serialize(function(){
    db.run('CREATE TABLE IF NOT EXISTS sites (sitename TEXT, ttl TEXT, cached_filename TEXT)')

    db.get("SELECT * FROM sites WHERE sitename = ?", sitename, function(err, row){
        console.log(row);
    });
})
