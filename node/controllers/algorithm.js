const db                 = require('../db')
const {NodeVM, VMScript} = require('vm2');
const serializerr        = require('serializerr')
const utils              = require('../utils')
const UserWallet         = require('./wallet')
const Transaction        = require('./transaction')
const CurrencyPricePoint = require('./currency_price_point')

class Algorithm {
    async run(id) {
        // Get prices for this algo
        var algo         = await this.getByID(id)
        var prices       = await CurrencyPricePoint.getPrices(id);
        var transactions = await Transaction.get({user_wallet_id: algo.crypto_user_wallet_id});
        var wallet       = await UserWallet.getByID(algo.fund_user_wallet_id);
        var vm           = new NodeVM({
            timeout: 60000,
            console: 'redirect',
            require: {
                external: ['moment']
            },
            sandbox: {
                base: {
                    buy:          function(amount, priceNeeded) {UserWallet.buy(algo.fund_user_wallet_id, algo.crypto_user_wallet_id, amount, priceNeeded);},
                    sell:         function(transactions)        {UserWallet.sell(algo.crypto_user_wallet_id, algo.fund_user_wallet_id, transactions);      },
                    prices:       prices,
                    wallet:       wallet,
                    transactions: transactions
                }
            },
            wrapper: 'null'
        })

        var consoleOutput = [];
        vm.on('console.log', function(text) {
            consoleOutput.push(text);
        });

        vm.run(algo.text, __filename);

        // consoleOutput = consoleOutput.join('<br>');

        return consoleOutput;
    }

    async get(wheres) {
        return await db.select().from('algorithm').where(wheres).rows()
    }

    async getByID(id) {
        return await db.select().from('algorithm').where({algorithm_id: id}).row()
    }

    async insert(record) {
        return await db.insert('algorithm', record).returning('*').row()
    }

    async update(record) {
        return await db.update('algorithm', record).where({algorithm_id: record.algorithm_id}).returning('*').rows()
    }

    async delete(id) {
        return await db.delete().from('algorithm').where({algorithm_id: id}).rows()
    }
}

module.exports = new Algorithm()