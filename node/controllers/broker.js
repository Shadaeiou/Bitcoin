const db          = require('../db')
const serializerr = require('serializerr')
const utils       = require('../utils')

class Broker {
    async get(wheres) {
        return await db.select().from('broker').where(wheres).rows()
    }

    async getByID(id) {
        return await db.select().from('broker').where({broker_id: id}).row()
    }

    async insert(record) {
        return await db.insert('broker', record).returning('*').row()
    }

    async update(record) {
        return await db.update('broker', record).where({broker_id: record.broker_id}).returning('*').rows()
    }

    async delete(id) {
        return await db.delete().from('broker').where({broker_id: id}).rows()
    }
}

module.exports = new Broker()