const fs        = require('fs')
const db        = require('./db')
const Algorithm = require('./controllers/algorithm')

class RunAlgorithms {
    async run() {
        let algResponses = [];
        let algorithms   = await db.select().from('algorithm').where().rows()
        for (var ct = 0; ct < algorithms.length; ct++) {
            if (algorithms[ct].run_frequency == -1) {continue;                                                                                                        }
            if (algorithms[ct].run_frequency == 1)  {algResponses.push({user_id: algorithms[ct].user_id, response: await Algorithm.run(algorithms[ct].algorithm_id)});}
        }
        return algResponses;
    }
}

module.exports = new RunAlgorithms()