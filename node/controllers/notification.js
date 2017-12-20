const db          = require('../db')
const serializerr = require('serializerr')
const utils       = require('../utils')

class Notification {
    async get(wheres) {
        return await db.select().from('notification').join('notification_type', {'notification.notification_type_id': 'notification_type.notification_type_id'}).where(wheres).rows()
    }

    async getByID(id) {
        return await db.select().from('notification').where({notification_id: id}).row()
    }

    async insert(record) {
        return await db.insert('notification', record).returning('*').row()
    }

    async update(record) {
        return await db.update('notification', record).where({notification_id: record.notification_id}).returning('*').rows()
    }

    async delete(id) {
        return await db.delete().from('notification').where({notification_id: id}).rows()
    }
}

module.exports = new Notification()