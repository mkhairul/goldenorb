var sqlite = require('sqlite3').verbose();
var argv = require('minimist')(process.argv.slice(2));

var db = new sqlite.Database('./cached_scrape.sqlite');

// Check the DB if there exists a cached page
// If there is, check the TTL of the entry
// If its more than 1 hour, rescrape the page

var checkdb = function(sitename){ 
    return new Promise((resolve, reject) => {
        db.serialize(function(){
            db.run('CREATE TABLE IF NOT EXISTS sites (sitename TEXT, ttl TEXT, cached_filename TEXT, status TEXT)')

            db.get("SELECT * FROM sites WHERE sitename = ?", sitename, function(err, row){

                if(!row){ console.log('no result'); reject('No result'); }
                resolve(row);

            });        
        })
    })
}

if(require.main === module) {
    if(argv.hasOwnProperty('sitename') === false){ throw new Error('need --sitename'); }
    var sitename = argv['sitename'];
    checkdb(sitename);
}else{
    module.exports = checkdb
}


