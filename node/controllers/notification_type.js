const db          = require('../db')
const serializerr = require('serializerr')
const utils       = require('../utils')

class NotificationType {
    async get(wheres) {
        return await db.select().from('notification_type').where(wheres).rows()
    }

    async getByID(id) {
        return await db.select().from('notification_type').where({notification_type_id: id}).row()
    }

    async insert(record) {
        return await db.insert('notification_type', record).returning('*').row()
    }

    async update(record) {
        return await db.update('notification_type', record).where({notification_type_id: record.notification_type_id}).returning('*').rows()
    }

    async delete(id) {
        return await db.delete().from('notification_type').where({notification_type_id: id}).rows()
    }
}

module.exports = new NotificationType()