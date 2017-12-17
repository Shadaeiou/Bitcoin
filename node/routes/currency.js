const router      = require('express').Router()
const Currency    = require('../controllers/currency')
const serializerr = require('serializerr')
const utils       = require('../utils')

router.get('/:id', async function(req, res) {
    let result = null

    try {
        result = await Currency.getByID(req.params.id)
    }
    catch(e) {
        res.status(500).json(serializerr(e))
        return
    }

    utils.successTrue(res, result, 'Successfully retrieved currency info')
})

router.get('/', async function(req, res) {
    let result = null

    try {
        result = await Currency.get()
    }
    catch(e) {
        res.status(500).json(serializerr(e))
        return
    }

    utils.successTrue(res, result, 'Successfully retrieved currencies')
})

module.exports = router