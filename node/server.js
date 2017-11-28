const express      = require('express')
const path         = require('path')
const app          = express()
const bodyParser   = require('body-parser')
const _            = require('lodash')

app.use(bodyParser.urlencoded({extended: true}))
app.use(bodyParser.json())

initRoutes()

app.listen(3000, function () {
	console.log('Server listening on port 3000')
})

function initRoutes() {
	const subrouters = [
		'algorithm'
	]

	_.each(subrouters, function(subroute_path) {
		var subrouter = require('./routes/' + _.snakeCase(subroute_path) + '.js')
		app.use('/' + subroute_path, subrouter)
	})
}