const router      = require('express').Router()
const Algorithm   = require('../controllers/algorithm')
const serializerr = require('serializerr')
const utils       = require('../utils')

router.get('/run/:id', async function(req, res) {
    var result = null

    try {
        result = await Algorithm.run(req.params.id)
    }
    catch(e) {
        res.json({success: false, data: serializerr(e), msg: 'Error'})
        return
    }

    res.json({success: true, data: result, msg: 'Successfully ran algorithm'})
})

router.get('/', async function(req, res) {
    let result = null

    try {
        result = await Algorithm.get({user_id: req.session.key})
    }
    catch(e) {
        res.status(500).json(serializerr(e))
        return
    }

    utils.successTrue(res, result, 'Successfully retrieved algorithms')
})

router.get('/:id', async function(req, res) {
    let result = null

    try {
        result = await Algorithm.getByID(req.params.id)
    }
    catch(e) {
        res.status(500).json(serializerr(e))
        return
    }

    utils.successTrue(res, result, 'Successfully retrieved algorithms')
})

router.delete('/:id', async function(req, res) {
    let result = null

    try {
        result = await Algorithm.delete(req.params.id)
    }
    catch(e) {
        res.status(500).json(serializerr(e))
        return
    }

    utils.successTrue(res, result, 'Successfully deleted algorithm')
})

router.post('/:id', async function(req, res) {
    let result         = null
    let jsonRecord     = req.body.json_record
    if (!req.session.key) {utils.successFalse(res, null, 'Unable to save algorithm');return;}
    jsonRecord         = JSON.parse(jsonRecord);
    jsonRecord.user_id = req.session.key;

    try {
        result = await Algorithm.update(jsonRecord)
    }
    catch(e) {
        res.status(500).json(serializerr(e))
        return
    }

    utils.successTrue(res, result, 'Successfully retrieved algorithms')
})

router.post('/', async function(req, res) {
    let result         = null
    let jsonRecord     = req.body.json_record
    if (!req.session.key) {utils.successFalse(res, null, 'Unable to save algorithm');return;}
    jsonRecord         = JSON.parse(jsonRecord);
    jsonRecord.user_id = req.session.key;

    // TODO make sure user id == user_broker_id aka the user owns the broker

    try {
        result = await Algorithm.insert(jsonRecord)
    }
    catch(e) {
        res.status(500).json(serializerr(e))
        return
    }

    if (result === false) {utils.successFalse(res, null, 'There was an error adding algorithm');return;}

    utils.successTrue(res, null, 'Successfully added algorithm')
})

module.exports = router