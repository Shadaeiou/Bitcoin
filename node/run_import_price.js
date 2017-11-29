const fs     = require('fs')
const db     = require('./db')
const key    = fs.readFileSync('/etc/ni/cb_api_key.txt').toString().trim()
const secret = fs.readFileSync('/etc/ni/cb_api_secret.txt').toString().trim()
const Client = require('coinbase').Client;
const client = new Client({'apiKey': key, 'apiSecret': secret});

class ImportPrice {
    async run() {
    	let response = await this.importBTC()
    }

    async importBTC() {
    	let btcID = await db.select('currency_id').from('currency').where({name: 'btc'}).rows()	
    	btcID     = btcID[0]['currency_id']
    	let unix  = Math.round((new Date()).getTime() / 1000)
    	client.getBuyPrice({'currencyPair': 'BTC-USD'}, function(buyErr, buyObj) {
			var buy = buyObj.data.amount
			client.getSellPrice({'currencyPair': 'BTC-USD'}, async function(sellErr, sellObj) {
				var sell = sellObj.data.amount
				let response = await db.insert('currency_price_point', {currency_id: btcID, buy_price: buy, sell_price: sell, unix_time: unix}).returning('*').row()
			});
		});
    }
}

let importer = new ImportPrice()
importer.run()