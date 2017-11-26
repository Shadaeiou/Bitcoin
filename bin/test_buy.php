#!/usr/bin/php -q
<?php
chdir(dirname(__FILE__));

// Includes
include_once("../config/config.php");
include_once("../php/Utility.php");
include_once('../php/CoinbaseAPI/vendor/autoload.php');
use Coinbase\Wallet\Client;
use Coinbase\Wallet\Configuration;
use Coinbase\Wallet\Resource\Buy;
use Coinbase\Wallet\Value\Money;
use Coinbase\Wallet\Enum\CurrencyCode;
use Coinbase\Wallet\Resource\Account;

$configuration  = Configuration::apiKey(CB_API_KEY, CB_API_SECRET);
$client         = Client::create($configuration);

// Get your btc wallet account aka account to send btc to
$btc_wallet_account = null;
$all_accounts       = $client->getAccounts()->all();
foreach ($all_accounts as $account) {
	if ($account->getName() == 'BTC Wallet') {
		$btc_wallet_account = $account;
	}
}

$usd_wallet_payment_method = null;
$all_payment_methods       = $client->getPaymentMethods()->all();
foreach ($all_payment_methods as $payment_method) {
	if ($payment_method->getName() == 'USD Wallet') {
		$usd_wallet_payment_method = $payment_method;
	}
}

$expected = new Money(50, CurrencyCode::USD);
$buy      = new Buy();
$buy->setTotal($expected);
$buy->setPaymentMethod($usd_wallet_payment_method);

// $client->createAccountBuy($btc_wallet_account, $buy);
$data = $client->decodeLastResponse();
print_r($data);

// Array
// (
//     [data] => Array
//         (
//             [id] => ef2ac095-56f2-519a-b86e-c319e4894353
//             [status] => created
//             [payment_method] => Array
//                 (
//                     [id] => 472134db-9c49-5656-b95f-d0d84f9f0c1a
//                     [resource] => payment_method
//                     [resource_path] => /v2/payment-methods/472134db-9c49-5656-b95f-d0d84f9f0c1a
//                 )

//             [transaction] => Array
//                 (
//                     [id] => f755be38-e9f7-58dc-bcc9-7489912d4132
//                     [resource] => transaction
//                     [resource_path] => /v2/accounts/676b789e-2f9e-5d34-884c-379d2f5cd5fb/transactions/f755be38-e9f7-58dc-bcc9-7489912d4132
//                 )

//             [fees] => Array
//                 (
//                     [0] => Array
//                         (
//                             [type] => coinbase
//                             [amount] => Array
//                                 (
//                                     [amount] => 0.05
//                                     [currency] => USD
//                                 )

//                         )

//                     [1] => Array
//                         (
//                             [type] => bank
//                             [amount] => Array
//                                 (
//                                     [amount] => 0.00
//                                     [currency] => USD
//                                 )

//                         )

//                 )

//             [created_at] => 2016-05-08T13:17:06Z
//             [updated_at] => 2016-05-08T13:17:07Z
//             [resource] => buy
//             [resource_path] => /v2/accounts/676b789e-2f9e-5d34-884c-379d2f5cd5fb/buys/ef2ac095-56f2-519a-b86e-c319e4894353
//             [requires_completion_step] =>
//             [amount] => Array
//                 (
//                     [amount] => 0.01079984
//                     [currency] => BTC
//                 )

//             [total] => Array
//                 (
//                     [amount] => 5.00
//                     [currency] => USD
//                 )

//             [subtotal] => Array
//                 (
//                     [amount] => 4.95
//                     [currency] => USD
//                 )

//             [committed] => 1
//             [payout_at] => 2016-05-08T13:17:06Z
//             [instant] => 1
//         )

// )