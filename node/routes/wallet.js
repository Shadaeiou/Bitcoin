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

module.exports = router