const db               = require('../db')
const serializerr      = require('serializerr')
const utils            = require('../utils')
const UserBroker       = require('./user_broker')
const Transaction      = require('./transaction')
const Notification     = require('./notification')
const NotificationType = require('./notification_type')
const Currency         = require('./currency')
const Gdax             = require('gdax')
const moment           = require('moment')

class Wallet {
    async get(wheres) {
        return await db.select().from('user_wallet').where(wheres).rows()
    }

    async getByUserID(user_id) {
        var userBrokers = await UserBroker.get(user_id)
        var returnData  = []
        for (var ct = 0; ct < userBrokers.length; ct ++) {
            var wallets = await this.get({user_broker_id: userBrokers[ct].user_broker_id})
            for (var ct2 = 0; ct2 < wallets.length; ct2++) {
                wallets[ct2].broker_name = userBrokers[ct].broker_name
                wallets[ct2].broker_id   = userBrokers[ct].broker_id
                returnData.push(wallets[ct2])
            }
        }
        return returnData
    }

    async getSellPrice(broker_id, currency_id) {
        var publicClient = new Gdax.PublicClient('BTC-USD');
        var response = await publicClient.getProductTicker();

        return response.bid;
        // var prices = await db.select([
        //     '*',
        //     'buy_price::money::numeric::float8  as buy_price_val',
        //     'sell_price::money::numeric::float8 as sell_price_val'
        // ]).from('currency_price_point').where({broker_id: broker_id, currency_id: currency_id}).rows();
        // return prices[prices.length - 1].sell_price_val
    }

    async sellBC(crypto_wallet, amount, currency_id) {
        var sellPrice    = await this.getSellPrice(crypto_wallet.broker_id, currency_id);
        var bcAmt        = +amount.toFixed(8)
        var authedClient = new Gdax.AuthenticatedClient(crypto_wallet.config.api_key, crypto_wallet.config.api_secret, crypto_wallet.config.api_passphrase);
        const sellParams  = {
            'price':      sellPrice,
            'size':       bcAmt,
            'product_id': 'BTC-USD',
        };
        var response     = await authedClient.sell(sellParams);
        var status       = response.status;
        var ct           = 0;
        var stop         = 6;
        do {
            await this.sleep(10000);
            var responseCheck = await authedClient.getOrder(response.id);
            status            = responseCheck.status
        }
        while (status == 'pending' && ct < stop)
        responseCheck = await authedClient.getOrder(response.id);
        if (responseCheck.status != 'done') {var response = await authedClient.cancelOrder(response.id);return false;}

        return {sellPrice: responseCheck.price, moneyMade: responseCheck.executed_value}
    }

    async sell(crypto_wallet_id, fund_wallet_id, transactions) {
        var cryptoWallet = await this.getByID(crypto_wallet_id);
        var fundWallet   = await this.getByID(fund_wallet_id);

        if (cryptoWallet.currency_name == 'btc') {
            var totalBC = 0;
            for (var ct = 0; ct < transactions.length; ct++) {
                totalBC += transactions[ct].amount*1;
            }
            var response = await this.sellBC(cryptoWallet, totalBC, cryptoWallet.currency_id)
        }
        else {
            console.log("Wallet not configured for automatic transactions.")
        }

        if (!response) {console.log("Selling did not happen");}

        var fundBefore     = fundWallet.balance;
        var fundAfter      = fundWallet.balance*1 + response.moneyMade*1;
        var cryptoBefore   = cryptoWallet.balance;
        var cryptoAfter    = cryptoWallet.balance - totalBC*1;

        // Update wallet balance
        this.update({user_wallet_id: fund_wallet_id,   balance: fundAfter  });
        this.update({user_wallet_id: crypto_wallet_id, balance: cryptoAfter});

        // Update transactions
        for (var ct2 = 0; ct2 < transactions.length; ct2++) {
            var transaction            = transactions[ct2];
            delete transaction.buy_price_val;
            delete transaction.sell_price_val;
            delete transaction.price_needed_val;
            transaction.active         = false;
            transaction.sell_price     = response.sellPrice;
            transaction.unix_time_sold = Math.floor(new Date() / 1000);
            transaction.money_sold     = (response.moneyMade / transactions.length);
            Transaction.update(transaction);
        }

        // Create a notification row
        var sellNT = await NotificationType.get({abbr: 'sell'});
        Notification.insert({
            notification_type_id: sellNT[0].notification_type_id,
            user_id:              fundWallet.user_id,
            text:                 'Sold $'+response.moneyMade+' from '+fundWallet.name,
            unix_time:            Math.floor(new Date() / 1000)
        });

        return "Successfully sold"
    }

    async getBuyPrice(broker_id, currency_id) {
        var publicClient = new Gdax.PublicClient('BTC-USD');
        var response = await publicClient.getProductTicker();

        return response.ask;
        // var prices = await db.select([
        //     '*',
        //     'buy_price::money::numeric::float8  as buy_price_val',
        //     'sell_price::money::numeric::float8 as sell_price_val'
        // ]).from('currency_price_point').where({broker_id: broker_id, currency_id: currency_id}).rows();
        // return prices[prices.length - 1].buy_price_val
    }

    sleep(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }

    async buyBC(crypto_wallet, amount, currency_id) {
        var buyPrice     = await this.getBuyPrice(crypto_wallet.broker_id, currency_id);
        var bcAmt        = amount/buyPrice;
        bcAmt            = +bcAmt.toFixed(8)
        var authedClient = new Gdax.AuthenticatedClient(crypto_wallet.config.api_key, crypto_wallet.config.api_secret, crypto_wallet.config.api_passphrase);
        const buyParams  = {
            'price':      buyPrice,
            'size':       bcAmt,
            'product_id': 'BTC-USD',
        };
        var response     = await authedClient.buy(buyParams);
        var status       = response.status;
        var stop         = 6;
        var ct           = 0;
        do {
            await this.sleep(10000);
            var responseCheck = await authedClient.getOrder(response.id);
            status            = responseCheck.status
            ct++
        }
        while (status == 'pending' && ct < stop)
        responseCheck = await authedClient.getOrder(response.id);
        if (responseCheck.status != 'done') {var response = await authedClient.cancelOrder(response.id);return false;}
        return {bought: responseCheck.filled_size, pricePaid: responseCheck.price}
    }

    async buy(fund_wallet_id, crypto_wallet_id, amount, priceNeeded) {
        var cryptoWallet = await this.getByID(crypto_wallet_id);
        var fundWallet   = await this.getByID(fund_wallet_id);

        if (cryptoWallet.currency_name == 'btc') {
            var response = await this.buyBC(cryptoWallet, amount, cryptoWallet.currency_id)
        }
        else {
            console.log("Wallet not configured for automatic transactions.")
        }

        if (!response) {console.log("Buying did not happen");}

        var bought       = response.bought;
        var fundBefore   = fundWallet.balance;
        var fundAfter    = fundWallet.balance - amount*1;
        var cryptoBefore = cryptoWallet.balance;
        var cryptoAfter  = cryptoWallet.balance + bought*1;
        var pricePaid    = response.pricePaid;

        // Update wallet balance
        this.update({user_wallet_id: fund_wallet_id,   balance: fundAfter  });
        this.update({user_wallet_id: crypto_wallet_id, balance: cryptoAfter});

        // Create transaction row
        var transactionRow = {
            user_wallet_id:   crypto_wallet_id,
            buy_price:        pricePaid,
            price_needed:     priceNeeded,
            amount:           response.bought,
            unix_time_bought: Math.floor(new Date() / 1000),
            money_spent:      amount
        };

        Transaction.insert(transactionRow);

        // Create a notification row
        var buyNT = await NotificationType.get({abbr: 'buy'});
        Notification.insert({
            notification_type_id: buyNT[0].notification_type_id,
            user_id:              cryptoWallet.user_id,
            text:                 'Bought $'+amount+' deposited into '+cryptoWallet.name,
            unix_time:            Math.floor(new Date() / 1000)
        });

        return "Successfully bought"
    }

    async getByID(id) {
        var userWallet                = await db.select().from('user_wallet').where({user_wallet_id: id}).row()
        var userBroker                = await UserBroker.getByID(userWallet.user_broker_id)
        var currency                  = await Currency.getByID(userWallet.currency_id)
        userWallet.broker_name        = userBroker.broker_name;
        userWallet.broker_id          = userBroker.broker_id;
        userWallet.config             = (userBroker.config) ? userBroker.config : null;
        userWallet.sandbox            = userBroker.sandbox;
        userWallet.currency_name      = currency.name;
        userWallet.currency_full_name = currency.full_name;
        userWallet.user_id            = userBroker.user_id;

        return userWallet;
    }

    async insert(record) {
        return await db.insert('user_wallet', record).returning('*').row()
    }

    async update(record) {
        return await db.update('user_wallet', record).where({user_wallet_id: record.user_wallet_id}).returning('*').rows()
    }

    async delete(id) {
        return await db.delete().from('user_wallet').where({user_wallet_id: id}).rows()
    }
}

module.exports = new Wallet()