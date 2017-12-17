const db          = require('../db')
const serializerr = require('serializerr')
const utils       = require('../utils')
const UserBroker  = require('./user_broker')
const Transaction = require('./transaction')
const Currency    = require('./currency')
const nodemailer  = require('nodemailer')
const fs          = require("fs")
const pw          = fs.readFileSync('/etc/ni/gmail_pw.txt').toString().trim()

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

    async getBuyPrice(broker_id) {
        var prices = await db.select([
            '*',
            'buy_price::money::numeric::float8  as buy_price_val',
            'sell_price::money::numeric::float8 as sell_price_val'
        ]).from('currency_price_point').where({broker_id: broker_id}).rows();
        return prices[prices.length - 1].buy_price_val
    }

    async buyBC(broker_id, amount) {
        var buyPrice      = await this.getBuyPrice(broker_id);
        var fixedAmount   = amount;
        var testBCAmount  = fixedAmount/buyPrice;

        return {bought: testBCAmount, moneySpent: fixedAmount, pricePaid: buyPrice}
    }

    async buy(id, amount, priceNeeded) {
        // Check if sandbox wallet
        var wallet = await this.getByID(id);
        if (!wallet.sandbox) {
            // For now just bounce out
            return
        }

        if (wallet.currency_name == 'btc') {
            var response = await this.buyBC(wallet.broker_id, amount)
        }
        else {
            return
        }

        var before     = wallet.balance_val;
        var after      = wallet.balance_val - amount*1;
        var bought     = response.bought;
        var moneySpent = response.moneySpent;
        var pricePaid  = response.pricePaid;

        // Update wallet balance
        this.update({user_wallet_id: id, balance: after});

        // Create transaction row
        var transactionRow = {
            user_wallet_id:   id,
            buy_price:        pricePaid,
            price_needed:     priceNeeded,
            amount:           response.bought,
            unix_time_bought: Math.floor(new Date() / 1000),
            money_spent:      moneySpent
        };

        Transaction.insert(transactionRow);

        // Send email
        var smtpTransport = nodemailer.createTransport({
            host:       'smtp.gmail.com',
            port:       587,
            secure:     false,
            requireTLS: true,
            auth: {
                user: "burke.blazer@gmail.com",
                pass: pw
            }
        });

        // setup e-mail data with unicode symbols
        var mailOptions = {
            from:    "Burke Blazer<burke.blazer@gmail.com>",
            to:      "burke.blazer@gmail.com",
            subject: "User wallet "+wallet.name + " bought $"+amount,
            text:    "User wallet: "+wallet.name+"\nBuy price: "+pricePaid+"\nPrice needed: "+priceNeeded+"\nAmount: "+response.bought+"\nMoney spent: $"+moneySpent+"\nBalance before: "+before+"\nBalance after: "+after
        }

        // send mail with defined transport object
        smtpTransport.sendMail(mailOptions, function(error, response){
            smtpTransport.close(); // shut down the connection pool, no more messages
        });
    }

    async getByID(id) {
        var userWallet                = await db.select(['*', 'balance::money::numeric::float8 as balance_val']).from('user_wallet').where({user_wallet_id: id}).row()
        var userBroker                = await UserBroker.getByID(userWallet.user_broker_id)
        var currency                  = await Currency.getByID(userWallet.currency_id)
        userWallet.broker_name        = userBroker.broker_name;
        userWallet.broker_id          = userBroker.broker_id;
        userWallet.currency_name      = currency.name;
        userWallet.currency_full_name = currency.full_name;

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