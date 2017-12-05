const db          = require('../db')
const serializerr = require('serializerr')
const utils       = require('../utils')
const Broker      = require('./broker')

class UserBroker {
    async get(user_id) {
        var userBrokers = await db.select().from('user_broker').where({user_id: user_id}).rows()
        for (var ct = 0; ct < userBrokers.length; ct++) {
            var broker = await Broker.getByID(userBrokers[ct].broker_id)
            userBrokers[ct].broker_name = broker.name
        }
        return userBrokers
    }

    async getByID(id) {
        return await db.select().from('user_broker').where({user_broker_id: id}).row()
    }

    async insert(record) {
        return await db.insert('user_broker', record).returning('*').row()
    }

    async update(record) {
        return await db.update('user_broker', record).where({user_broker_id: record.user_broker_id}).returning('*').rows()
    }

    async delete(id) {
        return await db.delete().from('user_broker').where({user_broker_id: id}).rows()
    }
}

module.exports = new UserBroker()