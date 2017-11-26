<?php
header('X-Host: ' . php_uname('n'));

// Includes
include_once("../config/config.php");

// App includes, new class = new line
include_once("../php/app/User.php");
include_once("../php/Utility.php");
include_once('../php/CoinbaseAPI/vendor/autoload.php');

// Session
session_start();
session_name("CryptoCurrent");
if (!empty($_SESSION)) {$user_id = $_SESSION['user_id'];}
else                   {$user_id = null;                }

// Error reporting
error_reporting(E_ALL);
ini_set('display_errors', 0);

// Validate request and user
$overrides = array();
if (!(User::validate($user_id) || in_array($_REQUEST['mode'], $overrides)))
{
	$result = array(
		'success' => false,
		'logout'  => true,
		'error'   => 'Session expired'
	);
}
else if ($_REQUEST['mode'] == 'User::logOut')
{
	$result = executeMethod();
}
else
{
	session_write_close();
	$result = executeMethod();
}

function executeMethod() {
	foreach ($_REQUEST as $key => $value)
	{
		$matches = array();
		if (strpos($value, '%7B%22') !== false)
		{
			$value          = urldecode($value);
			$_REQUEST[$key] = $value;
		}

		if (preg_match('/^json_(.+)$/', $key, $matches))
		{
			$new_key            = $matches[1];
			$json               = stripcslashes($_REQUEST[$key]);
			if (is_null(json_decode($json, true))) {$json = $_REQUEST[$key];}
			$_REQUEST[$key]     = $json;
			$_REQUEST[$new_key] = json_decode($json, true);
		}
		else if ($value === 'true' || $value === 'false')
		{
			$_REQUEST[$key] = ($value === 'true' ? 1 : 0);
		}
	}

	try
	{
		return $result = Utility::executeMethod($_REQUEST["mode"], $_REQUEST);
	}
	catch (Exception $ex)
	{
		return $result = array(
			'success' => false,
			'error'   => $ex->getMessage()
		);
	}
}

$json = json_encode($result);
$json = str_replace('"status":"t"', '"status":true',  $json);
$json = str_replace('"status":"f"', '"status":false', $json);
print $json;