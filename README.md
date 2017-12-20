# Crypto Auto Script
Web based cryto coin bot tracking/buying/selling website. Create a user, add your broker accounts (right now just support GDAX with focus on BTC), add your API credentials (they get encrypted and stored in a database looking for any ideas on how to make this more secure since it's kind of required to have the bots buy and sell without user interaction). The site stores buy and sell prices every minute. You can then create your own algorithms using the pricing data and have use the exposed buy and sell functions in your algorithm to buy and sell whatever amounts you want. You can specify whether you want the scripts to run every minute, 5 minutes, 15 minutes, you get the idea, up to once a day. Sends email notifications on all buys and sells. Can create Private broker wallets or use a sandbox broker if you don't want an actual trading to happen but it will "fake" the transaction (could be useful for general testing and backtesting of algorithms). Eventually want a place to run backtests on algorithms, share algorithms with other users, so that everyone can prosper and have fun. Ultimately this is just a fun side project that I'd like to include my friends on. I have this running on a shitty Cubox with 3GB of space, eventually want to put it on a cloud host. Very new to nodejs so don't expect the code to be very good. A sample algorithm is in node/sample.js idea is pretty simple: Every minute calculate the 24hr average price, if the current price is below that price and it's not currently falling, make a buy for 10% of available cash in your fund wallet. Subsequent buys will first check to see if an active buy has already been made within 1% of the current buy price, if it's lower it'll buy more, if it's not it won't. Script will stop with about $25 left in wallet. Script will check active buys to see if the price needed (price needed is %.0025 for the maker taker fee in GDAX + 5% ROI) is hit, if it is then it will sell any active buys for profit.

To install the server:
- Install postgres
- Install nodejs and npm
- Follow the directions below to install redis-server
- Run the sql create db script
- nodemon node/server.js to start the server

# Install Redis Server
echo 'Install Redis'
cd /tmp
wget http://download.redis.io/redis-stable.tar.gz
tar xvzf redis-stable.tar.gz
cd redis-stable
make
cd src
sudo cp redis-server /usr/local/bin/
sudo cp redis-cli /usr/local/bin/
echo 'Redis install completed. '