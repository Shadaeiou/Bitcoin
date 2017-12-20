const router       = require('express').Router()
const Notification = require('../controllers/notification')
const serializerr  = require('serializerr')
const utils        = require('../utils')

router.get('/:id', async function(req, res) {
    let result = null

    try {
        result = await Notification.getByID(req.params.id)
    }
    catch(e) {
        res.status(500).json(serializerr(e))
        return
    }

    utils.successTrue(res, result, 'Successfully retrieved notification info')
})

router.get('/', async function(req, res) {
    let result = null

    try {
        result = await Notification.get({user_id: req.session.key})
    }
    catch(e) {
        res.status(500).json(serializerr(e))
        return
    }

    utils.successTrue(res, result, 'Successfully retrieved notifications')
})

module.exports = router