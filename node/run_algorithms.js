const fs        = require('fs')
const db        = require('./db')
const Algorithm = require('./controllers/algorithm')

class RunAlgorithms {
    async run() {
    	let response = await this.runAlgorithms()
        return;
    }

    async runAlgorithms() {
        let algorithms = await db.select().from('algorithm').where().rows()
        for (var ct = 0; ct < algorithms.length; ct++) {
            if (algorithms[ct].run_frequency == -1) {continue;       }
            if (algorithms[ct].run_frequency == 1)  {Algorithm.run(algorithms[ct].algorithm_id);}
        }
    }
}

module.exports = new RunAlgorithms()