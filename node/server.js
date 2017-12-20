const express           = require('express')
const app               = express()
const server            = require('http').Server(app)
const io                = require('socket.io').listen(server)
const session           = require('express-session')
const redisStore        = require('connect-redis')(session)
const redis             = require("redis")
const client            = redis.createClient()
const path              = require('path')
const bodyParser        = require('body-parser')
const _                 = require('lodash')
const schedule          = require('node-schedule')
const webBase           = '../web/'
const RunImportPrice    = require('./run_import_price')
const RunAlgorithms     = require('./run_algorithms')
const SendNotifications = require('./send_notifications')
const db                = require('./db')

// Import prices
const importPrices   = schedule.scheduleJob('* * * * *', async function(){
	RunImportPrice.run()

	var twoRecords = await db.select().from('currency_price_point').where().orderBy('unix_time DESC').limit(3).rows();

	io.emit('new_price', twoRecords);
});

const runAlgorithms  = schedule.scheduleJob('* * * * *', async function(){
	var algoResponses = await RunAlgorithms.run()
	for (var ct = 0; ct < algoResponses.length; ct++) {
		io.emit('algorithm_response_'+algoResponses[ct].user_id, algoResponses[ct].response);
	}
});

const sendNotificaions = schedule.scheduleJob('* * * * *', async function() {
	var notifications = await SendNotifications.run()
	for (var ct = 0; ct < notifications.length; ct++) {
		io.emit('notification_'+notifications[ct].user_id, notifications[ct]);
	}
});

client.on("error", function (err) {
    console.log("Redis error: " + err)
})

app.use(session({
    secret:            'porch children once food',
    store:             new redisStore({host: 'localhost', port: 6379, client: client}),
    saveUninitialized: false,
    resave:            false
}))

app.use(bodyParser.urlencoded({extended: true}))
app.use(bodyParser.json())

initRoutes()

server.listen(3000, function () {
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
		'wallet',
		'broker',
		'user_broker',
		'currency',
		'notification',
		'notification_type',
		'transaction'
	]

	_.each(subrouters, function(subroute_path) {
		var subrouter = require('./routes/' + _.snakeCase(subroute_path) + '.js')
		app.use('/' + subroute_path, subrouter)
	})
}