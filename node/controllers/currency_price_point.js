const db          = require('../db')
const serializerr = require('serializerr')
const utils       = require('../utils')
const UserWallet  = require('./wallet')

class CurrencyPricePoint {
    async get(wheres) {
        return await db.select().from('currency_price_point').where(wheres).rows()
    }

    async getByID(id) {
        return await db.select().from('currency_price_point').where({currency_price_point_id: id}).row()
    }

    async getPrices(algorithm_id) {
        var algo       = await db.select().from('algorithm').where({algorithm_id: algorithm_id}).row()
        var userWallet = await UserWallet.getByID(algo.user_wallet_id)

        return await db.select([
            '*',
            'buy_price::money::numeric::float8  as buy_price_val',
            'sell_price::money::numeric::float8 as sell_price_val'
        ]).from('currency_price_point').where({broker_id: userWallet.broker_id}).rows();
    }

    async insert(record) {
        return await db.insert('currency_price_point', record).returning('*').row()
    }

    async update(record) {
        return await db.update('currency_price_point', record).where({currency_price_point_id: record.currency_price_point_id}).returning('*').rows()
    }

    async delete(id) {
        return await db.delete().from('currency_price_point').where({currency_price_point_id: id}).rows()
    }
}

module.exports = new CurrencyPricePoint()