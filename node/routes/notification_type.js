const router           = require('express').Router()
const NotificationType = require('../controllers/notification_type')
const serializerr      = require('serializerr')
const utils            = require('../utils')

router.get('/:id', async function(req, res) {
    let result = null

    try {
        result = await NotificationType.getByID(req.params.id)
    }
    catch(e) {
        res.status(500).json(serializerr(e))
        return
    }

    utils.successTrue(res, result, 'Successfully retrieved notification type info')
})

router.get('/', async function(req, res) {
    let result = null

    try {
        result = await NotificationType.get()
    }
    catch(e) {
        res.status(500).json(serializerr(e))
        return
    }

    utils.successTrue(res, result, 'Successfully retrieved notification types')
})

module.exports = router