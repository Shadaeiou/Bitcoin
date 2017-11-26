<?php
$config_dir = dirname(__FILE__);
$root_dir   = realpath($config_dir.'/..');
$lib_dir    = realpath($root_dir.'/php');

define('SITE_INSTANCE', realpath($root_dir));
define('CONFIG_PATH',   $config_dir);
define('LIB_PATH',      $lib_dir);
define('BIN_PATH',      $root_dir.'/bin/');
define('CLASS_PATH',    LIB_PATH);
define('DB_PORT',       5432);
define('DB_USER',       'postgres');
define('DB_HOST',       'localhost');
define('DB_NAME',       'cryptocurrent');
define('DB_PASS',       trim(file_get_contents('/etc/ni/pgsql.txt')));
define('CB_API_KEY',    trim(file_get_contents('/etc/ni/cb_api_key.txt')));
define('CB_API_SECRET', trim(file_get_contents('/etc/ni/cb_api_secret.txt')));