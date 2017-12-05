const router      = require('express').Router()
const Broker      = require('../controllers/broker')
const serializerr = require('serializerr')
const utils       = require('../utils')

router.get('/', async function(req, res) {
    let result = null

    try {
        result = await Broker.get(req.session.key)
    }
    catch(e) {
        res.status(500).json(serializerr(e))
        return
    }

    utils.successTrue(res, result, 'Successfully retrieved user broker')
})

// params
//   id - broker id
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

module.exports = router