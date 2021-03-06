const router      = require('express').Router()
const Wallet      = require('../controllers/wallet')
const serializerr = require('serializerr')
const utils       = require('../utils')

router.get('/', async function(req, res) {
    let result = null

    try {
        result = await Wallet.getByUserID(req.session.key)
    }
    catch(e) {
        res.status(500).json(serializerr(e))
        return
    }

    utils.successTrue(res, result, 'Successfully retrieved user wallet')
})

// params
//   id - wallet id
router.get('/:id', async function(req, res) {
    let result = null

    try {
        result = await Wallet.getByID(req.params.id)
    }
    catch(e) {
        res.status(500).json(serializerr(e))
        return
    }

    utils.successTrue(res, result, 'Successfully retrieved wallet info')
})

router.post('/', async function(req, res) {
    let result         = null
    let jsonRecord     = req.body.json_record
    if (!req.session.key) {utils.successFalse(res, null, 'Unable to save wallet');return;}
    jsonRecord         = JSON.parse(jsonRecord);

    // TODO make sure user id == user_broker_id aka the user owns the broker

    try {
        result = await Wallet.insert(jsonRecord)
    }
    catch(e) {
        res.status(500).json(serializerr(e))
        return
    }

    if (result === false) {utils.successFalse(res, null, 'There was an error adding wallet');return;}

    utils.successTrue(res, null, 'Successfully added wallet')
})

module.exports = router