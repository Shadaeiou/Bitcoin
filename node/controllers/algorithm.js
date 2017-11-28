const db       = require('../db')
const safeEval = require('safe-eval')

class Algorithm {
    async run(id) {
    	var algo = await db.select().from('algorithm').where({algorithm_id: id}).rows()
        return safeEval(algo[0].text, {getPrices: this.getPrices})
    }

    async getPrices() {
        return await db.select().from('currency_price_point').rows();
    }
}

module.exports = new Algorithm()