const express      = require('express')
const app          = express()
const session      = require('express-session');
const redisStore   = require('connect-redis')(session);
const redis        = require("redis")
const client       = redis.createClient()
const path         = require('path')
const bodyParser   = require('body-parser')
const _            = require('lodash')
const webBase      = '../web/'

client.on("error", function (err) {
    console.log("Redis error: " + err)
})

app.use(session({
    secret:            'porch children once food',
    store:             new redisStore({host: 'localhost', port: 6379, client: client, ttl: 260}),
    saveUninitialized: false,
    resave:            false
}))

app.use(bodyParser.urlencoded({extended: true}))
app.use(bodyParser.json())

initRoutes()

app.listen(3000, function () {
	console.log('Server listening on port 3000')
})

function initRoutes() {
	// Serve up the web directory static files
	app.use(express.static('../web'));

	// Serve up the main index
	app.get('/', function (req, res) {
		res.sendFile(path.resolve(webBase + 'index.html'))
	})

	const subrouters = [
		'algorithm',
		'user',
		'wallet'
	]

	_.each(subrouters, function(subroute_path) {
		var subrouter = require('./routes/' + _.snakeCase(subroute_path) + '.js')
		app.use('/' + subroute_path, subrouter)
	})
}