const fs           = require('fs')
const db           = require('./db')
const key          = fs.readFileSync('/etc/ni/gdax_api_key.txt').toString().trim()
const secret       = fs.readFileSync('/etc/ni/gdax_api_secret.txt').toString().trim()
const passphrase   = fs.readFileSync('/etc/ni/gdax_api_passphrase.txt').toString().trim()
const Gdax         = require('gdax')
const moment       = require('moment')

class ImportPrice {
    async run() {
    	let response = await this.importBTC()
    }

    async importBTC() {
        let btcID    = await db.select('currency_id').from('currency').where({name: 'btc'}).rows() 
        btcID        = btcID[0]['currency_id']

        let brokerID = await db.select('broker_id').from('broker').where({name: 'Coinbase'}).rows() 
        brokerID     = brokerID[0]['broker_id']

        const publicClient = new Gdax.PublicClient();
        var callback = async function(error, response, data) {
            var buy  = data.bid;
            var sell = data.ask;
            var unix = moment(data.time, moment.ISO_8601).unix()
            await db.insert('currency_price_point', {currency_id: btcID, buy_price: buy, sell_price: sell, unix_time: unix, broker_id: brokerID}).returning('*').row()
        }
        publicClient.getProductTicker(callback);
    }
}

let importer = new ImportPrice()
importer.run()