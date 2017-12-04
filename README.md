# Crypto Auto Script
Web based cryto coin tracking website. Can create a user, add your broker accounts (right now just support coinbase), add your API credentials. The site auto tracks different brokerage's buy and sell prices. You can then create your own algorithms based on these prices and have auto buy and sells pushed automatically 24/7.

To install the server:
- Install postgres
- Install nodejs and npm
- Follow the directions below to install redis-server
- Run the sql create db script
- Add a cronjob for the bin/run_import_price.php script
    - * * * * * php /home/bblazer/Bitcoin/bin/run_import_price.php 1>/home/bblazer/Bitcoin/log/run_import_price.log 2>>/home/bblazer/Bitcoin/log/run_import_price.log
- Create a user through the URL bar for now User::register function

End game idea:
- Users will be able to create their own algorithms in javascript based on buy and sell prices
	- e.g. create a running 24hr average and when the price dips below that, fire off a buy and when the sell price matches the required sell price for ROI it will automatically sell that coin


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