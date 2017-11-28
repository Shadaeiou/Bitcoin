const fs = require('fs')
const pw = fs.readFileSync('/etc/ni/pgsql.txt').toString().trim()
const db = require('pg-bricks').configure({
	host:                    'localhost',
	user:                    'postgres',
	max:                     20,
	database:                'cryptocurrent',
	idleTimeoutMillis:       30000,
	connectionTimeoutMillis: 2000,
	password:                pw
})

module.exports = db