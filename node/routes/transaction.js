const router      = require('express').Router()
const Transaction = require('../controllers/transaction')
const serializerr = require('serializerr')
const utils       = require('../utils')

router.get('/:id', async function(req, res) {
    let result = null

    try {
        result = await Transaction.getByID(req.params.id)
    }
    catch(e) {
        res.status(500).json(serializerr(e))
        return
    }

    utils.successTrue(res, result, 'Successfully retrieved transaction info')
})

router.get('/', async function(req, res) {
    let result = null

    try {
        result = await Transaction.get()
    }
    catch(e) {
        res.status(500).json(serializerr(e))
        return
    }

    utils.successTrue(res, result, 'Successfully retrieved transactions')
})

module.exports = router