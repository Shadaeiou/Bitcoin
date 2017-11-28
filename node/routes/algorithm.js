const router      = require('express').Router()
const Algorithm   = require('../controllers/algorithm')
const serializerr = require('serializerr')

router.get('/run/:id', async function(req, res) {
    var result = null

    try {
        result = await Algorithm.run(req.params.id)
    }
    catch(e) {
        res.status(500).json(serializerr(e))
        return
    }

    res.json({success: true, data: result, msg: 'Successfully ran algorithm'})
})

module.exports = router