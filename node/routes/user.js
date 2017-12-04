const router      = require('express').Router()
const User        = require('../controllers/user')
const serializerr = require('serializerr')
const utils       = require('../utils')

// logout
router.get('/logout', async function(req, res) {
    req.session.destroy(function(err){
        if(err){
            res.status(500).json(serializerr(err))
            return
        } else {
            utils.successTrue(res, null, 'Successfully logged out')
        }
    });
})

// params
//   id - user id
router.get('/:id', async function(req, res) {
    let result = null

    try {
        result = await User.getByID(req.params.id)
    }
    catch(e) {
        res.status(500).json(serializerr(e))
        return
    }

    utils.successTrue(res, result, 'Successfully retrieved user')
})

// login
router.post('/login', async function(req, res) {
    let result = null
    let email  = req.body.email
    let pw     = req.body.password

    try {
        result = await User.logIn(email, pw)
    }
    catch(e) {
        res.status(500).json(serializerr(e))
        return
    }

    // TODO: obfuscate the error messages
    if (result === null)  {utils.successFalse(res, null, 'User not found.');      return;}
    if (result === false) {utils.successFalse(res, null, 'Password is incorrect');return;}

    // Set the user session
    req.session.key = result;

    // Get user info
    let userInfo = await User.getUserInfo(result)

    utils.successTrue(res, userInfo, 'Successfully logged user in')
})

// register
router.post('/register', async function(req, res) {
    let result     = null
    let jsonRecord = req.body.json_record

    try {
        result = await User.register(JSON.parse(jsonRecord), req.session)
    }
    catch(e) {
        res.status(500).json(serializerr(e))
        return
    }

    if (result === false) {utils.successFalse(res, null, 'User already exists');return;}

    utils.successTrue(res, null, 'Successfully registered user')
})

module.exports = router