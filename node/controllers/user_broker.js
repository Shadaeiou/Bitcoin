const db          = require('../db')
const serializerr = require('serializerr')
const crypto      = require('crypto')
const utils       = require('../utils')
const Broker      = require('./broker')
const fs          = require('fs')
const encryptBase = fs.readFileSync('/etc/ni/encrypt_base.txt').toString().trim()

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
        var userBroker         = await db.select().from('user_broker').where({user_broker_id: id}).row()
        var broker             = await Broker.getByID(userBroker.broker_id)
        userBroker.broker_name = broker.name

        // Decrypt config
        if (userBroker.config) {
            var key               = encryptBase+userBroker.user_id;
            var cipher            = crypto.createCipher('aes-256-cbc',   key)
            var decipher          = crypto.createDecipher('aes-256-cbc', key);
            var decryptedPassword = decipher.update(userBroker.config, 'base64', 'utf8');
            userBroker.config     = decryptedPassword + decipher.final('utf8');
            userBroker.config     = JSON.parse(userBroker.config)
        }

        return userBroker
    }

    async insert(record) {
        // Encrypt config
        var key           = encryptBase+record.user_id;
        var cipher        = crypto.createCipher('aes-256-cbc',   key)
        var decipher      = crypto.createDecipher('aes-256-cbc', key);
        var encryptedText = cipher.update(record.config, 'utf8', 'base64');
        encryptedText     = encryptedText + cipher.final('base64');
        record.config     = encryptedText;

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