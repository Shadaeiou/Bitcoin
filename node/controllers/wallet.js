const db          = require('../db')
const serializerr = require('serializerr')
const utils       = require('../utils')
const UserBroker  = require('./user_broker')

class Wallet {
    async get(wheres) {
        return await db.select().from('user_wallet').where(wheres).rows()
    }

    async getByUserID(user_id) {
        var userBrokers = await UserBroker.get(user_id)
        var returnData  = []
        for (var ct = 0; ct < userBrokers.length; ct ++) {
            var wallets = await this.get({user_broker_id: userBrokers[ct].user_broker_id})
            for (var ct2 = 0; ct2 < wallets.length; ct2++) {
                wallets[ct2].broker_name = userBrokers[ct].broker_name
                returnData.push(wallets[ct2])
            }
        }
        return returnData
    }

    async getByID(id) {
        return await db.select().from('user_wallet').where({user_wallet_id: id}).row()
    }

    async insert(record) {
        return await db.insert('user_wallet', record).returning('*').row()
    }

    async update(record) {
        return await db.update('user_wallet', record).where({user_wallet_id: record.user_wallet_id}).returning('*').rows()
    }

    async delete(id) {
        return await db.delete().from('user_wallet').where({user_wallet_id: id}).rows()
    }
}

module.exports = new Wallet()