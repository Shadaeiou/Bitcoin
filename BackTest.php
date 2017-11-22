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

class BackTest
{
	private $client        = null;
	private $prices        = array();
	private $all_prices    = null;
	private $config        = null;
	private $transactions  = array();
	private $wallet        = array('plus_minus' => 300);

	public function run($config)
	{
		$this->config = $config;
		$this->client = Client::create(Configuration::apiKey("1WjZUju0Ww48rzwG", "5yNxwN3xAX74Nu1SCF2TAcUGa554P1Ne"));
		$this->config = $this->getConfig();

		$this->getPrices();
		$this->runPrices();
	}

	protected function runPrices()
	{
		foreach ($this->all_prices as $count => $price) {
			$this->prices[] = $price;
			$this->checkSells();
			$this->checkBuys($price['unix']);
		}

		print "<pre>";
		print_r($this->wallet);
		print "</pre>";

		print "<pre>";
		print_r($this->transactions);
		print "</pre>";
	}

	protected function checkBuys($unix)
	{
		$avg_buy_price        = $this->getBuyAvg();
		$current_buy_price    = $this->getBuyPrice();
		$smooth_avg_buy_price = $this->getSmoothBuyAvg();
		$max_tf_hr            = $this->getBuyMax(strtotime('-1 day', $unix));

		// If price is less than 24hr average and it's no longer going down
		if ($current_buy_price > $avg_buy_price)        {return;}
		if ($current_buy_price < $smooth_avg_buy_price) {return;}

		// Make sure we have enough cash
		if ($this->wallet['plus_minus'] < 25) {return;}

		$smallest    = 99999999;
		$most_recent = 99999999;
		foreach ($this->transactions as $transaction) {
			if ($transaction['active'] == false)     {continue;}
			$minutes = (strtotime('now') - $transaction['unix']) / 60;
			if ($minutes < $most_recent)                {$most_recent = $minutes;                  }
			if ($transaction['price_paid'] < $smallest) {$smallest    = $transaction['price_paid'];}
		}

		// Make sure this amount is 1% less than the smallest amount we've already bought
		if ($current_buy_price > $smallest - ($smallest *.01) && $smallest != 99999999) {return;}

		// Check to make sure the price_needed isn't completely unreasonable
		$price_needed = $this->getPriceNeeded($current_buy_price);
		if ($price_needed > $max_tf_hr) {return;}

		$this->buyBCForAmount($this->wallet['plus_minus']*.15);
	}

	protected function buyBCForAmount($amount) {
		list($bought_bc, $money_spent, $price_paid) = $this->buyBC($amount);
		$price_needed                               = $this->getPriceNeeded($price_paid);

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
		$price_paid_with_fee_and_earning_and_selling = ($price_paid_with_fee_and_earning * .03) + $price_paid_with_fee_and_earning;

		return $price_paid_with_fee_and_earning_and_selling;
	}

	protected function getBuyAvg()
	{
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

		return round($total / $ct_act, 2);
	}

	protected function getBuyMin($unix)
	{
		$min = 9999999;
		foreach ($this->prices as $price) {
			if ($unix && $unix < $price['unix']) {continue;}
			if ($price['bc_buy'] < $min) {
				$min = $price['bc_buy'];
			}
		}
		return $min;
	}

	protected function getBuyMax($unix)
	{
		$max = -1;
		foreach ($this->prices as $price) {
			if ($unix && $unix < $price['unix']) {continue;}
			if ($price['bc_buy'] > $max) {
				$max = $price['bc_buy'];
			}
		}

		return $max;
	}

	protected function getSmoothBuyAvg()
	{
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
		return round($total / $ct_act, 2);
	}

	protected function getSmoothSellAvg()
	{
		$total      = 0;
		$smooth_avg = $this->config['smooth_avg'];
		$start      = (count($this->prices)-1) - $smooth_avg;
		$ct_act     = 0;
		foreach ($this->prices as $count => &$price) {
			if ($count >= $start) {
				$total += $price['bc_sell'];
				$ct_act++;
			}
		}

		return round($total / $ct_act, 2);
	}

	protected function getBuyPrice()
	{
		return $this->prices[count($this->prices) - 1]['bc_buy'];
	}

	protected function getSellPrice()
	{
		return $this->prices[count($this->prices) - 1]['bc_sell'];
	}

	protected function checkSells()
	{
		$sells      = array();
		$smooth     = $this->getSmoothSellAvg();
		$sell_price = $this->getSellPrice();
		foreach ($this->transactions as &$transaction) {
			if (!$transaction['active']) {continue;}

			if ($transaction['price_needed'] <= $sell_price) {
				if ($sell_price > $smooth) {continue;}
				$sells[] = $transaction;
			}
		}

		if (!$sells) {return;}

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
		if (!$this->all_prices)
		{
			$prices_json = file_get_contents('prices.txt');
			$prices      = array();
			if ($prices_json) {
				$prices  = json_decode($prices_json, true);
			}
			$this->all_prices = $prices;
		}
		return $this->all_prices;
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
		$total_bc   = 0.0;
		$sell_price = $this->getSellPrice();
		foreach ($sells as $sell) {
			$total_bc += $sell['bc_bought'];
		}

		$total_money_sold  = $total_bc*$sell_price;
		$money_divided     = $total_money_sold/count($sells);
		$money_divided     = $total_money_sold/count($sells);
		foreach ($this->transactions as &$transaction) {
			foreach ($sells as $sell) {
				if ($transaction['unix'] == $sell['unix']) {
					$transaction['active']     = false;
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

$config = json_decode($_REQUEST['json_config'], true);
$bt     = new BackTest();
$bt->run($config);

?>
