const db          = require('../db')
const serializerr = require('serializerr')
const utils       = require('../utils')

class Currency {
    async get(wheres) {
        return await db.select().from('currency').where(wheres).rows()
    }

    async getByID(id) {
        return await db.select().from('currency').where({currency_id: id}).row()
    }

    async insert(record) {
        return await db.insert('currency', record).returning('*').row()
    }

    async update(record) {
        return await db.update('currency', record).where({currency_id: record.currency_id}).returning('*').rows()
    }

    async delete(id) {
        return await db.delete().from('currency').where({currency_id: id}).rows()
    }
}

module.exports = new Currency()