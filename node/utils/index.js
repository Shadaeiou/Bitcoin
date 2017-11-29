var crypto            = require('crypto')
var algorithm         = 'aes-256-ctr'
var password          = 'ww4gwaDnGVdSAYpes9dLw8YCCnqAYE'
module.exports = {
	successFalse: (res, data, msg) => {
		res.json({success: false, data: data, msg: msg})
	},
	successTrue: (res, data, msg) => {
		res.json({success: true, data: data, msg: msg})
	},
	encrypt: (text) => {
		var cipher  = crypto.createCipher(algorithm,password)
		var crypted = cipher.update(text,'utf8','hex')
		crypted     += cipher.final('hex');
		return crypted;
	},
	decrypt: (text) => {
		var decipher = crypto.createDecipher(algorithm,password)
		var dec      = decipher.update(text,'hex','utf8')
		dec          += decipher.final('utf8');
		return dec;
	}
}