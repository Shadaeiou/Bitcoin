const db          = require('../db')
const serializerr = require('serializerr')
const utils       = require('../utils')

class Transaction {
    async get(user_id) {

    }

    async getByID(id) {
        return await db.select().from('user_wallet_transaction').where({user_wallet_transaction_id: id}).row()
    }

    async insert(record) {
        return await db.insert('user_wallet_transaction', record).returning('*').row()
    }

    async update(record) {
        return await db.update('user_wallet_transaction', record).where({user_wallet_transaction_id: record.user_wallet_transaction_id}).returning('*').rows()
    }

    async delete(id) {
        return await db.delete().from('user_wallet_transaction').where({user_wallet_transaction_id: id}).rows()
    }
}

module.exports = new Transaction()