const moment  = require('moment');
const TFHRS   = 24; // 24Hrs
const FIFTM   = 15; // 15Mins
const TWODAYS = 2;  // 2Days
const BIG     = 999999999999;

class Main {
    constructor() {
        this.dataPoints   = [];
        this.prices       = base.prices;
        this.wallet       = base.wallet;
        this.transactions = base.transactions;
        
        // Splice prices for charting
        // this.splicePrices();
    }
    
    run() {
        // Using a 1 minute resolution for data points on chart
        // this.buildChartPoints();
        
        // Check for possible buy position
        // base.buy(25, this.buyPriceNeeded(this.prices[this.prices.length - 1].buy_price_val));
        console.log('Checking buys...');
        this.checkBuy();
        
        // Check for possible sell of positions
        console.log('');
        console.log('Checking sells...');
        this.checkSells();
    }
    
    checkSells() {
        var mostRecent = this.prices.length - 1;
        var smoothAvg  = this.calculateAverage(mostRecent - FIFTM, mostRecent, 'sell_price_val');
        var sellPrice  = this.prices[mostRecent].sell_price_val;
        var sells      = [];
		for (var ct = 0; ct < this.transactions.length; ct++) {
			if (!this.transactions[ct].active) {continue;}

			if (this.transactions[ct].price_needed <= sellPrice) {
				if (sellPrice > smoothAvg) {console.log('Sale price still rising');continue;}
				sells.push(this.transactions[ct]);
			}
		}

		if (!sells.length) {console.log('No active sells meet criteria');return;}

        base.sell(sells);
    }
    
    checkBuy() {
        var mostRecent  = this.prices.length - 1;
        var avg         = this.calculateAverage(mostRecent - (TFHRS * 60), mostRecent, 'buy_price_val');
        var smoothAvg   = this.calculateAverage(mostRecent - FIFTM,        mostRecent, 'buy_price_val');
        var priceNeeded = this.buyPriceNeeded(this.prices[mostRecent].buy_price_val);
        var maxBuy      = this.getMax(mostRecent - (TFHRS * 60), mostRecent, 'buy_price_val');
        var buyPrice    = this.prices[mostRecent].buy_price_val;
        var sellPrice   = this.prices[mostRecent].sell_price_val;
        var smallest    = this.getSmallestBought();
        
        console.log('Time: '        +moment(this.prices[mostRecent].unix_time*1000).format('YYYY-MM-DD hh:mm:ss a'));
        console.log('Buy price: '   +buyPrice);
        console.log('Sell price: '  +sellPrice);
        console.log('Avg: '         +avg);
        console.log('Price needed: '+priceNeeded);
        console.log('Max buy: '     +maxBuy);
        console.log('Smooth avg: '  +smoothAvg);
        console.log('Smallest: '    +smallest);
        console.log('Wallet +/- : ' +this.wallet.balance);
        console.log('');
        
		if (buyPrice > avg)                                            {console.log("Current buy price > avg 24hr price");   return;}
		if (buyPrice > smallest - (smallest *0.01) && smallest != BIG) {console.log("Bought already at this amount");        return;}
		if (priceNeeded > maxBuy)                                      {console.log("Price needed to profit not reasonable");return;}
		if (this.wallet.balance < 25)                                  {console.log("Not enough cash in wallet");            return;}
		if (buyPrice < smoothAvg)                                      {console.log("Price still dropping");                 return;}
		
	    base.buy(this.wallet.balance*0.1, priceNeeded);
    }
    
    getSmallestBought() {
        var smallest = BIG;
        for (var ct = 0; ct < this.transactions.length; ct++) {
            if (this.transactions[ct].buy_price_val < smallest) {smallest = this.transactions[ct].buy_price_val}
        }
        
        return smallest;
    }
    
    splicePrices() {
        this.prices.splice(TWODAYS*24*60);
    }
    
    buildChartPoints() {
        // For every single point we wanna calculate the average and the smooth avg based on the constants above
        for (var ct = 0; ct < this.prices.length; ct++) {
            var avg         = this.calculateAverage(ct - (TFHRS * 60), ct, 'buy_price_val');
            var smoothAvg   = this.calculateAverage(ct - FIFTM,        ct, 'buy_price_val');
            var priceNeeded = this.buyPriceNeeded(this.prices[ct].buy_price_val);
            var maxBuy      = this.getMax();
            this.dataPoints.push({
                unix:            this.prices[ct].unix_time,
    			readable:        moment(this.prices[ct].unix_time*1000).format('YYYY-MM-DD hh:mm:ss a'),
    			bc_buy:          this.prices[ct].buy_price_val,
    			bc_sell:         this.prices[ct].sell_price_val,
    			buy_avg:         avg,
    			smooth_buy_avg:  smoothAvg,
    			price_needed:    priceNeeded
    // 			smallest:        ($smallest == 99999999) ? null : round($smallest - ($smallest *.01), 2) // Should be in a function -_-
            });
        }
        console.log(JSON.stringify(this.dataPoints[this.dataPoints.length - 1]));
    }
    
    getMax(toIndex, fromIndex, dataPoint) {
        if (toIndex < 0)          {toIndex = 0;                           }
        if (toIndex == fromIndex) {return this.prices[toIndex][dataPoint];}
        
        var max = -1;
        for (var ct = toIndex; ct < fromIndex; ct++) {
            if (this.prices[ct][dataPoint] > max) {max = this.prices[ct][dataPoint];}
        }
        
        return max;
    }
    
    calculateAverage(toIndex, fromIndex, dataPoint) {
        if (toIndex < 0)          {toIndex = 0;                           }
        if (toIndex == fromIndex) {return this.prices[toIndex][dataPoint];}
        
        var total   = 0;
        for (var ct = toIndex; ct < fromIndex; ct++) {
            total += this.prices[ct][dataPoint];
        }
        
        return Math.round((total/(fromIndex - toIndex))* 100) / 100;
    }
    
    buyPriceNeeded(price) {
		price = (price * 0.01) + price; // 1% fee for buying 
		price = (price * 0.01) + price; // 1% for selling
		price = (price * 0.03) + price; // 10% ROI

		return Math.round(price * 100) / 100;
    }
}

var main = new Main();
main.run();