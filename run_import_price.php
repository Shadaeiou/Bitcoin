#!/usr/bin/php -q
<?php
chdir(dirname(__FILE__));
include_once('./CoinbaseAPI/vendor/autoload.php');
use Coinbase\Wallet\Client;
use Coinbase\Wallet\Configuration;
use Coinbase\Wallet\Resource\Buy;
use Coinbase\Wallet\Value\Money;
use Coinbase\Wallet\Enum\CurrencyCode;
use Coinbase\Wallet\Resource\Account;

error_reporting(E_ALL & ~E_NOTICE & ~E_WARNING);
print date('h:i A').PHP_EOL;

class RunImport
{
	private $buy_amount    = 25;
	private $client        = null;
	private $transactions  = null;
	private $prices        = null;
	private $wallet        = null;
	private $config        = null;
	private $bc_data       = array();

	public function run()
	{
		$this->config = $this->getConfig();
		$this->client = Client::create(Configuration::apiKey($this->config['coinbase']['key'], $this->config['coinbase']['secret']));

		$this->getWallet();
		$this->getTransactions();
		$this->getPrices();

		$this->checkSells();
		$this->checkBuys();
		$this->addDataPoint();

		$this->setTransactions();
		$this->setWallet();
		$this->setPrices();
	}

	protected function addDataPoint()
	{
		$smallest = 99999999;
		foreach ($this->transactions as $transaction) {
			if ($transaction['active'] == false)     {continue;}

			$minutes = (strtotime('now') - $transaction['unix']) / 60;
			if ($transaction['price_paid'] < $smallest) {$smallest    = $transaction['price_paid'];}
		}
		$buy_price  = $this->getBuyPrice();
		$sell_price = $this->getSellPrice();
		$buy_avg    = $this->getBuyAvg();
		$smooth_avg = $this->getSmoothBuyAvg();
		$this->prices[] = array(
			'unix'            => time(),
			'readable'        => date('c'),
			'bc_buy'          => $buy_price,
			'bc_sell'         => $sell_price,
			'buy_avg'         => $buy_avg,
			'avg_interval'    => $this->config['main_avg'],
			'smooth_buy_avg'  => $smooth_avg,
			'smooth_interval' => $this->config['smooth_avg'],
			'price_needed'    => round($this->getPriceNeeded($buy_price), 2),
			'smallest'        => round($smallest, 2)
		);
		if (count($this->prices) > 10080) {
			array_shift($this->prices);
		}
	}

	protected function checkBuys()
	{
		print "\t"."Checking buys...".PHP_EOL;

		$avg_buy_price        = $this->getBuyAvg();
		$current_buy_price    = $this->getBuyPrice();
		$smooth_avg_buy_price = $this->getSmoothBuyAvg();
		$max_tf_hr            = $this->getBuyMax(strtotime('-1 day'));
		$price_needed         = $this->getPriceNeeded($current_buy_price);
		$smallest             = 99999999;
		foreach ($this->transactions as $transaction) {
			if ($transaction['active'] == false)     {continue;}

			$minutes = (strtotime('now') - $transaction['unix']) / 60;
			if ($transaction['price_paid'] < $smallest) {$smallest    = $transaction['price_paid'];}
		}

		// If price is less than 24hr average and it's no longer going down
		// print "\t\t"."Buy price: ".$current_buy_price.PHP_EOL;
		// print "\t\t"."Avg buy price: ".$avg_buy_price.PHP_EOL;
		// print "\t\t"."Smooth buy price: ".$smooth_avg_buy_price.PHP_EOL;
		// print "\t\t"."Cash in hand: ".$this->wallet['plus_minus'].PHP_EOL;
		// print "\t\t"."Smallest: ".round(($smallest - ($smallest *.01)), 2).PHP_EOL;
		// print "\t\t"."Price needed: ".$price_needed.PHP_EOL;
		if ($current_buy_price > $avg_buy_price)                                        {print "\t\t"."Current buy price > avg 24hr price".PHP_EOL;return;   }
		if ($current_buy_price > $smallest - ($smallest *.01) && $smallest != 99999999) {print "\t\t"."Bought already at this amount".PHP_EOL;return;          }
		if ($price_needed > $max_tf_hr)                                                 {print "\t\t"."Price needed to profit not reasonable".PHP_EOL;return;  }
		if ($this->wallet['plus_minus'] < 25)                                           {print "\t\t"."Not enough cash in wallet".PHP_EOL;return;          }
		if ($current_buy_price < $smooth_avg_buy_price)                                 {print "\t\t"."Price still dropping".PHP_EOL;return;          }

		$this->buyBCForAmount($this->wallet['plus_minus']*.2);
	}

	protected function buyBCForAmount($amount) {
		// Record the price we paid per BC, the price we need BC to hit to sell, the time we bought, how many BC we bought, and how much $$ we spent
		print "\t\t"."Attempting to buy $".$amount;

		// TODO: use API to buy BC
		list($bought_bc, $money_spent, $price_paid) = $this->buyBC($amount);
		$price_needed                               = $this->getPriceNeeded($price_paid);

		print "\t\t"."Successfully bought $".$amount.PHP_EOL;

		$new_transaction = array(
			'price_paid'   => $price_paid,
			'price_needed' => round($price_needed, 2),
			'unix'         => strtotime('now'),
			'readable'     => date('c'),
			'bc_bought'    => $bought_bc,
			'money_spent'  => round($money_spent, 2),
			'active'       => true
		);

		$this->updateWallet($amount*-1);

		$this->transactions[] = $new_transaction;
	}

	protected function buyBC($amount) {
		$buy_price = $this->getBuyPrice();

		// // Get your btc wallet account aka account to send btc to
		// $btc_wallet_account = null;
		// $all_accounts       = $client->getAccounts()->all();
		// foreach ($all_accounts as $account) {
		// 	if ($account->getName() == 'BTC Wallet') {
		// 		$btc_wallet_account = $account;
		// 	}
		// }

		// // This will be the payment method account aka USD Wallet
		// $usd_wallet_payment_method = null;
		// $all_payment_methods       = $client->getPaymentMethods()->all();
		// foreach ($all_payment_methods as $payment_method) {
		// 	if ($payment_method->getName() == 'USD Wallet') {
		// 		$usd_wallet_payment_method = $payment_method;
		// 	}
		// }

		// $expected = new Money($amount, CurrencyCode::USD);
		// $buy      = new Buy();
		// $buy->setTotal($expected);
		// $buy->setPaymentMethod($usd_wallet_payment_method);

		// $client->createAccountBuy($btc_wallet_account, $buy);
		// $data = $client->decodeLastResponse();

		// $price = $data['data']['sub_total']/$data['data']['amount'];
		$fixed_amount   = $amount;
		$test_bc_amount = $fixed_amount/$buy_price;

		return array($test_bc_amount, $amount, $buy_price);
		// return array($data['data']['amount'], $data['data']['total'], $price);
	}

	protected function getPriceNeeded($price_paid) {
		// 1% profit and 1% from selling
		$price_paid_with_fee                         = $price_paid;
		$price_paid_with_fee_and_earning             = ($price_paid_with_fee * .01) + $price_paid_with_fee;
		$price_paid_with_fee_and_earning_and_selling = ($price_paid_with_fee_and_earning * .01) + $price_paid_with_fee_and_earning;

		return $price_paid_with_fee_and_earning_and_selling;
	}

	protected function getBuyAvg()
	{
		if ($this->bc_data['buy_avg']) {return $this->bc_data['buy_avg'];}
		$total    = 0;
		$main_avg = $this->config['main_avg']*60;
		$start    = (count($this->prices)-1) - $main_avg;
		$ct_act   = 0;
		foreach ($this->prices as $count => &$price) {
			if ($count >= $start) {
				$total += $price['bc_buy'];
				$ct_act++;
			}
		}
		$this->bc_data['buy_avg'] = round($total / $ct_act, 2);
		return $this->bc_data['buy_avg'];
	}

	protected function getBuyMin($unix)
	{
		if ($this->bc_data['buy_min']) {return $this->bc_data['buy_min'];}
		$min = 9999999;
		foreach ($this->prices as $price) {
			if ($unix && $unix < $price['unix']) {continue;}
			if ($price['bc_buy'] < $min) {
				$min = $price['bc_buy'];
			}
		}
		$this->bc_data['buy_min'] = $min;
		return $this->bc_data['buy_min'];
	}

	protected function getBuyMax($unix)
	{
		if ($this->bc_data['buy_max']) {return $this->bc_data['buy_max'];}
		$max = -1;
		foreach ($this->prices as $price) {
			if ($unix && $unix < $price['unix']) {continue;}
			if ($price['bc_buy'] > $max) {
				$max = $price['bc_buy'];
			}
		}
		$this->bc_data['buy_max'] = $max;
		return $this->bc_data['buy_max'];
	}

	protected function getSmoothBuyAvg()
	{
		if ($this->bc_data['smooth_avg']) {return $this->bc_data['smooth_avg'];}
		$total      = 0;
		$smooth_avg = $this->config['smooth_avg'];
		$start      = (count($this->prices)-1) - $smooth_avg;
		$ct_act    = 0;
		foreach ($this->prices as $count => &$price) {
			if ($count >= $start) {
				$total += $price['bc_buy'];
				$ct_act++;
			}
		}
		$this->bc_data['smooth_avg'] = round($total / $ct_act, 2);
		return $this->bc_data['smooth_avg'];
	}

	protected function getSmoothSellAvg()
	{
		if ($this->bc_data['smooth_avg_sell']) {return $this->bc_data['smooth_avg_sell'];}
		$total      = 0;
		$smooth_avg = $this->config['smooth_avg'];
		$start      = (count($this->prices)-1) - $smooth_avg;
		$ct_act    = 0;
		foreach ($this->prices as $count => &$price) {
			if ($count >= $start) {
				$total += $price['bc_sell'];
				$ct_act++;
			}
		}
		$this->bc_data['smooth_avg_sell'] = round($total / $ct_act, 2);
		return $this->bc_data['smooth_avg_sell'];
	}

	protected function getBuyPrice($type = 'bc')
	{
		if ($type == 'bc') 
		{
			if (!$this->bc_data['buy']) 
			{
				$this->bc_data['buy'] = $this->client->getBuyPrice(null, array('quote' => true))->getAmount();
			}
			return $this->bc_data['buy'];
		}
	}

	protected function getSellPrice($type = 'bc')
	{
		if ($type == 'bc') 
		{
			if (!$this->bc_data['sell']) 
			{
				$this->bc_data['sell'] = $this->client->getSellPrice(null, array('quote' => true))->getAmount();
			}
			return $this->bc_data['sell'];
		}
	}

	protected function checkSells()
	{
		print "\t"."Checking sells...".PHP_EOL;

		$sells      = array();
		$smooth     = $this->getSmoothSellAvg();
		$sell_price = $this->getSellPrice();
		foreach ($this->transactions as &$transaction) {
			if (!$transaction['active']) {continue;}

			if ($transaction['price_needed'] <= $sell_price) {
				if ($sell_price > $smooth) {print "\t\t"."Sale price still rising".PHP_EOL;continue;}
				$sells[] = $transaction;
			}
		}

		if (!$sells) {print "\t\t"."No active sells meet criteria".PHP_EOL;return;}

		$this->sellBC($sells);
	}

	protected function getConfig()
	{
		if (!$this->config)
		{
			$config_json = file_get_contents('config.txt');
			$config      = array();
			if ($config_json) {
				$config  = json_decode($config_json, true);
			}
			$this->config = $config;
		}
		return $this->config;
	}

	protected function getTransactions()
	{
		if (!$this->transactions)
		{
			$transactions_json = file_get_contents('transactions.txt');
			$transactions      = array();
			if ($transactions_json) {
				$transactions  = json_decode($transactions_json, true);
			}
			$this->transactions = $transactions;
		}
		return $this->transactions;
	}

	protected function getPrices()
	{
		if (!$this->prices)
		{
			$prices_json = file_get_contents('prices.txt');
			$prices      = array();
			if ($prices_json) {
				$prices  = json_decode($prices_json, true);
			}
			$this->prices = $prices;
		}
		return $this->prices;
	}

	protected function getWallet()
	{
		if (!$this->wallet)
		{
			$wallet_json = file_get_contents('wallet.txt');
			$wallet      = array();
			if ($wallet_json) {
				$wallet  = json_decode($wallet_json, true);
			}
			$this->wallet = $wallet;
		}
		return $this->wallet;
	}

	protected function sellBC($sells) {
		print "\t\t".count($sells)." active sell(s) met criteria".PHP_EOL;
		$total_bc   = 0.0;
		$sell_price = $this->getSellPrice();
		foreach ($sells as $sell) {
			$total_bc += $sell['bc_bought'];
		}

		print "\t\t"."Attempting to sell ".$total_bc."BC".PHP_EOL;

		// TODO sell BC

		print "\t\t"."Successfully sold ".$total_bc."BC".PHP_EOL;

		$total_money_sold  = $total_bc*$sell_price;
		$money_divided     = $total_money_sold/count($sells);
		$money_divided     = $total_money_sold/count($sells);
		foreach ($this->transactions as &$transaction) {
			foreach ($sells as $sell) {
				if ($transaction['unix'] == $sell['unix']) {
					$transaction['active']     = false;
					$transaction['sell_price'] = $sell_price;
					$transaction['money_sold'] = round($money_divided, 2);

					$this->updateWallet($money_divided);
				}
			}
		}
	}

	protected function updateWallet($amount) {
		$before                      =  $this->wallet['plus_minus'];
		$this->wallet['plus_minus'] += $amount;
		round($this->wallet['plus_minus'], 2);

		print "\t\t"."Wallet changed from $".$before." to $".$this->wallet['plus_minus'].PHP_EOL;

		mail('burke.blazer@gmail.com', 'BC Money Transaction', "Went from $".$before." to $".$this->wallet['plus_minus']);
	}

	protected function setPrices()
	{
		file_put_contents('prices.txt', json_encode($this->prices));
	}

	protected function setTransactions()
	{
		file_put_contents('transactions.txt', json_encode($this->transactions));
	}

	protected function setWallet() 
	{
		file_put_contents('wallet.txt', json_encode($this->wallet));
	}
}

$import = new RunImport();
$import->run();

?>
