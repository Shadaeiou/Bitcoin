const router      = require('express').Router()
const UserBroker  = require('../controllers/user_broker')
const serializerr = require('serializerr')
const utils       = require('../utils')

router.get('/:id', async function(req, res) {
    let result = null

    try {
        result = await UserBroker.getByID(req.params.id)
    }
    catch(e) {
        res.status(500).json(serializerr(e))
        return
    }

    utils.successTrue(res, result, 'Successfully retrieved broker info')
})

router.get('/', async function(req, res) {
    let result = null

    try {
        result = await UserBroker.get(req.session.key)
    }
    catch(e) {
        res.status(500).json(serializerr(e))
        return
    }

    utils.successTrue(res, result, 'Successfully retrieved user broker')
})

router.post('/', async function(req, res) {
    let result         = null
    let jsonRecord     = req.body.json_record
    if (!req.session.key) {utils.successFalse(res, null, 'Unable to save user broker');return;}
    jsonRecord         = JSON.parse(jsonRecord);
    jsonRecord.user_id = req.session.key;

    try {
        result = await UserBroker.insert(jsonRecord)
    }
    catch(e) {
        res.status(500).json(serializerr(e))
        return
    }

    if (result === false) {utils.successFalse(res, null, 'There was an error adding user broker');return;}

    utils.successTrue(res, null, 'Successfully added user broker')
})

module.exports = router