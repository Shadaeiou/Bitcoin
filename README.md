# Bitcoin
Coinbase Auto BS Script

To install:
- Have apache and PHP installed
- Add a cronjob for the run_import_price.php script 
    - * * * * * php /home/bblazer/Bitcoin/run_import_price.php 1>/home/bblazer/Bitcoin/run_import_price.log 2>>/home/bblazer/Bitcoin/run_import_price.log
- Major logic is inside the run_import_price script
    - Check sells and Check buys functions are the main check functions
- There are prices.txt, transactions.txt, wallet.txt, config.txt, and run_import_price.log
    - These txt files are basically the storage for all the data
- If your server is set up for mail there is a mail call in the script as well
- I accidently committed my coinbase api key and secret but have since removed them and changed them so you don't have to tell me i screwed up, i already know i did
- TestBuy.php is a test buy script
- You can make a coinbase api key by using google, realize it will take 48hrs for it to become enabled
