const router      = require('express').Router()
const Broker      = require('../controllers/broker')
const serializerr = require('serializerr')
const utils       = require('../utils')

router.get('/:id', async function(req, res) {
    let result = null

    try {
        result = await Broker.getByID(req.params.id)
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
        result = await Broker.get()
    }
    catch(e) {
        res.status(500).json(serializerr(e))
        return
    }

    utils.successTrue(res, result, 'Successfully retrieved user broker')
})

module.exports = router