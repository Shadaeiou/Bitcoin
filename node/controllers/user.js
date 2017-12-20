const db          = require('../db')
const crypto      = require('crypto')
const bcrypt      = require('bcrypt')
const serializerr = require('serializerr')
const utils       = require('../utils')

class User {
    async get(wheres) {
        return await db.select().from('user').where(wheres).rows()
    }

    async getByID(id) {
        return await db.select().from('user').where({user_id: id}).row()
    }

    async insert(record) {
        return await db.insert('user', record).returning('*').row()
    }

    async update(record) {
        return await db.update('user', record).where({user_id: record.user_id}).returning('*').rows()
    }

    async delete(id) {
        return await db.delete().from('user').where({user_id: id}).rows()
    }

    async logIn(email, password) {
        // See if user exists
        let user = await this.get({email: email})
        if (!user.length) {return null;}
        user     = user[0]

        // Test password against hash
        let userHash = await bcrypt.hash(password, user.salt);

        if (user.password === userHash) {return user.user_id;}
        else                            {return false;       }
    }

    async getUserInfo(userID) {
        // TODO: Finalize what we need to return
        let user = await this.getByID(userID)
        return {name: user.first_name+' '+user.last_name, user_id: user.user_id}
    }

    async register(record) {
        // See if user already exists
        let user
        user = await this.get({email: record.email})
        if (user.length) {return false;}

        // Generate pw hash and salt
        let salt        = await bcrypt.genSaltSync(10)
        let hash        = await bcrypt.hash(record.password, salt);
        record.salt     = salt;
        record.password = hash;

        // Insert user
        user = await db.insert('user', record).returning('user_id').row()

        let userID = ''
        try {
            userID = await utils.encrypt(user.user_id)
        }
        catch(e) {
            console.log(serializerr(e))
            return
        }

        return userID
    }
}

module.exports = new User()