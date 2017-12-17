const router             = require('express').Router()
const CurrencyPricePoint = require('../controllers/currency_price_point')
const serializerr        = require('serializerr')
const utils              = require('../utils')

router.get('/:id', async function(req, res) {
    let result = null

    try {
        result = await CurrencyPricePoint.getByID(req.params.id)
    }
    catch(e) {
        res.status(500).json(serializerr(e))
        return
    }

    utils.successTrue(res, result, 'Successfully retrieved price info')
})

router.get('/', async function(req, res) {
    let result = null

    try {
        result = await CurrencyPricePoint.get()
    }
    catch(e) {
        res.status(500).json(serializerr(e))
        return
    }

    utils.successTrue(res, result, 'Successfully retrieved prices')
})

module.exports = router