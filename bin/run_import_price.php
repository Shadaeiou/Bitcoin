#!/usr/bin/php -q
<?php
chdir(dirname(__FILE__));

// Includes
include_once("../config/config.php");
include_once("../php/Utility.php");
include_once('../php/CoinbaseAPI/vendor/autoload.php');
use Coinbase\Wallet\Client;
use Coinbase\Wallet\Configuration;

list($btc)  = Utility::selectOne('currency_id', 'currency', array('name' => 'btc'), true);
$client     = Client::create(Configuration::apiKey(CB_API_KEY, CB_API_SECRET));
$buy_price  = $client->getBuyPrice(null,  array('quote' => true))->getAmount();
$sell_price = $client->getSellPrice(null, array('quote' => true))->getAmount();
$unix_time  = time();

Utility::insertInto('currency_price_point', array('currency_id' => $btc, 'buy_price' => $buy_price, 'sell_price' => $sell_price, 'unix_time' => $unix_time));

?>