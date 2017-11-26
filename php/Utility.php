<?php

class Utility
{
	protected static $conn = null;
	protected static function getMethodProperties($method)
	{
		$tags          = array();
		$comment_block = $method->getDocComment();
		$comment_lines = explode("\n", $comment_block);

		foreach ($comment_lines as $comment_line)
		{
			if (preg_match('/@([a-z]+) {0,}(.*){0,1}/', $comment_line, $results))
			{
				$tag    = $results[1];
				$params = trim($results[2]);

				switch ($tag) {
					case 'extern':
						// If extern is specified by itself or explicitly set to true, set it.
						if ($params == '' || preg_match('/true/', strtolower($params)))
						{
							$tags[$tag] = true;
						}
						break;

					default:
						$tags[$tag][] = $params;
						break;
				}
			}
		}

		return $tags;
	}

	protected static function validateMethod($method)
	{
		if (!$method)                                      {throw new Exception("Unable to find method: " . $method->getName());}
		if ($method->isProtected() || $method->isPrivate()){throw new Exception("Cannot invoke private or protected method: " . $method->getName());}

		// Parse PHPDoc tags for method.
		$doc_tags = self::getMethodProperties($method);

		if (!isset($doc_tags['extern']) || !$doc_tags['extern']){throw new Exception('@extern not specified in comment block.  Cannot call method: ' . $method->getName());}
	}

	public static function executeMethod($method_name, $method_params)
	{
		if (preg_match('/^([A-Za-z_]+)::([A-Za-z_]+)$/', $method_name, $method_parts))
		{
			$class       = $method_parts[1];
			$method_name = $method_parts[2];
			$ob          = null;
		}
		else
		{
			throw new Exception("Utility::executeMethod() - Malformed \$method_name = $method_name");
		}

		$reflection  = new ReflectionClass($class);
		$method      = $reflection->getMethod($method_name);
		self::validateMethod($method);
		$params      = $method->getParameters();

		$method_args = Array();
		foreach ($params as $param)
		{
			$name = $param->getName();
			if (isset($method_params[$name]))
			{
				$method_args[$param->getPosition()] = $method_params[$name];
			}
			else
			{
				if (!$param->isOptional())
				{
					throw new Exception("Parameter \"$name\" is required in method \"$method_name\"\n");
				}
				else
				{
					$method_args[$param->getPosition()] = $param->getDefaultValue();
				}
			}
		}

		$result = $method->invokeArgs($ob, $method_args);

		return $result;
	}

	public static function recursiveDelete($str)
	{
		if (is_file($str))
		{
			return unlink($str);
		}

		if (is_dir($str))
		{
			$scan = glob(rtrim($str,'/').'/*');

			foreach ($scan as $index=>$path)
			{
				self::recursiveDelete($path);
			}

			return rmdir($str);
		}
	}

	public static function getSqlConn()
	{
		if (self::$conn && is_resource(self::$conn))
		{
			return self::$conn;
		}

		$conn_str   = sprintf('host=%s port=%d dbname=%s user=%s password=%s', DB_HOST, DB_PORT, DB_NAME, DB_USER, DB_PASS);
		self::$conn = pg_connect($conn_str);

		if (!self::$conn)
		{
			throw new Exception('Utility::getSqlConn() - Could not pg_connect to ' . DB_HOST . ' - ' . DB_NAME);
		}

		return self::$conn;
	}

	public static function closeSqlConn()
	{
		@pg_close(self::$conn);
		self::$conn = null;
	}

	public static function uprint($array)
	{
		if (is_string($array))
		{
			$string = $array;
		}
		else
		{
			$array  = $max_depth ? self::array_truncate($array, $max_depth) : $array;
			$string = preg_replace('/Array[\s\n\t]*/', 'Array ', print_r($array, true));
		}

		print "<pre>".($label ? "$label: " : '');
		print_r($string);
		print "</pre>";
	}

    public static function encryptDataAPI($plaintext)
	{
	    return base64_encode(mcrypt_encrypt(MCRYPT_RIJNDAEL_256, ENCRYPTION_KEY, $plaintext, 'nofb'));
	}

	public static function decryptDataAPI($ciphertext)
	{
	    return mcrypt_decrypt(MCRYPT_RIJNDAEL_256, ENCRYPTION_KEY, base64_decode($ciphertext), 'nofb');
	}

	public static function successTrue($data = null, $msg = '') {
		return array(
			'success' => true,
			'msg'     => $msg,
			'data'    => $data
		);
	}

	public static function successFalse($data = null, $msg = '') {
		return array(
			'success' => false,
			'msg'     => $msg,
			'data'    => $data
		);
	}

	public static function throwIfNo($test, $name = null, $msg = null, $backtrace = null)
	{
		if (!$test)
		{
			$backtrace = $backtrace ? $backtrace : debug_backtrace();
			extract(array_shift($backtrace), EXTR_PREFIX_ALL, 'error');
			extract(array_shift($backtrace), EXTR_PREFIX_ALL, 'caller');
			throw new Exception("$caller_class::$caller_function@$error_line - ".($msg ? $msg : ($name ? "Invalid value for $name." : 'Unable to complete operation.')));
		}
	}

	public static function pgQueryParams($sql, $params)
	{
		$conn = Utility::getSqlConn();
		$sqh  = pg_query_params($conn, $sql, $params);

		if ($sqh)
		{
			$rows = pg_fetch_all($sqh);

			return ($rows ? $rows : array());
		}
		else
		{
			$error = pg_last_error($conn);
			Utility::throwIfNo(false, '', "Encountered error while executing SQL ($sql): $error");
		}
	}

	public static function select($selects, $table, $wheres = array())
	{
		if (!is_array($selects))
		{
			$selects = array($selects);
		}

		$select_clauses = array();
		$where_clauses  = array();
		$params         = array();

		foreach ($selects as $select_key => $select_value)
		{
			if (is_string($select_key))
			{
				$select_clauses[] = ((strpos($select_key, '(') !== false) ? $select_key : Utility::quoteWrap($select_key)).' AS '.Utility::quoteWrap($select_value);
			}
			else
			{
				$select_clauses[] = (strpos($select_value, '(') !== false) ? $select_value : Utility::quoteWrap($select_value);
			}
		}

		foreach ($wheres as $where_key => $where_value)
		{
			$where_key = Utility::quoteWrap($where_key);

			if (is_null($where_value))
			{
				$where_clauses[] = "$where_key IS NULL";
			}
			else
			{
				$params[]        = $where_value;
				$where_clauses[] = "$where_key = \$".count($params);
			}
		}

		$where_clauses[] = 'true';

		$rows = Utility::pgQueryParams("
			SELECT
				".implode(",\n\t\t\t\t", $select_clauses)."

			FROM
				".Utility::quoteWrap($table)."

			WHERE
				".implode(" AND\n\t\t\t\t", $where_clauses).";
		", $params);

		return $rows;
	}

	public static function selectOne($selects, $table, $wheres, $indexed = false)
	{
		$rows = Utility::select($selects, $table, $wheres);

		if (empty($rows)) {return null;}

		return ($indexed && $rows[0]) ? array_values($rows[0]) : $rows[0];
	}

	public static function update($table, $sets, $wheres, $return_values = '*', $indexed = false)
	{
		if (!is_array($return_values)) {
			$return_values = array($return_values);
		}

		$set_clauses   = array();
		$where_clauses = array();
		$params        = array();

		foreach ($sets as $set_key => $set_value) {
			if (strpos($set_key, 'utility_exec_') === 0) {
				$set_key       = Utility::quoteWrap(str_replace('utility_exec_', '', $set_key));
				$set_clauses[] = "$set_key = $set_value";
			}
			else {
				$set_key       = Utility::quoteWrap($set_key);
				$params[]      = is_bool($set_value) ? ($set_value * 1) : $set_value;
				$set_clauses[] = "$set_key = \$".count($params);
			}
		}

		foreach ($wheres as $where_key => $where_value) {
			$where_key = Utility::quoteWrap($where_key);

			if (is_null($where_value)) {
				$where_clauses[] = "$where_key IS NULL";
			}
			else {
				$params[]        = $where_value;
				$where_clauses[] = "$where_key = \$".count($params);
			}
		}

		$rows = Utility::pgQueryParams("
			UPDATE
				".Utility::quoteWrap($table)."

			SET
				".implode(",\n\t\t\t\t", $set_clauses)."

			WHERE
				".implode(" AND\n\t\t\t\t", $where_clauses)."

			RETURNING
				".implode(",\n\t\t\t\t", Utility::quoteWrap($return_values)).";
		", $params);

		return ($indexed && $rows[0]) ? array_values($rows[0]) : $rows[0];
	}

	public static function insertInto($table, $values, $return_values = '*', $indexed = false)
	{
		if (!is_array($return_values))
		{
			$return_values = array($return_values);
		}

		$fields     = array_keys($values);
		$param_vars = array();
		$params     = array_values($values);

		for ($i = 1; $i <= count($params); $i++)
		{
			$param_vars[] = "\$$i";
		}

		$rows = Utility::pgQueryParams("
			INSERT INTO
				".Utility::quoteWrap($table)." (".implode(', ', Utility::quoteWrap($fields)).")

			VALUES
				(
					".implode(",\n\t\t\t\t\t", $param_vars)."
				)

			RETURNING
				".implode(",\n\t\t\t\t", Utility::quoteWrap($return_values)).";
		", $params);

		return ($indexed && $rows[0]) ? array_values($rows[0]) : $rows[0];
	}

	protected static function quoteWrap($keys)
	{
		Utility::throwIfNo(is_string($keys) || is_array($keys), '', 'Invalid type for $keys.');

		if (is_array($keys))
		{
			$quoted_keys = array();

			foreach ($keys as $key)
			{
				$quoted_keys[] = Utility::quoteWrap($key);
			}

			return $quoted_keys;
		}
		else if (is_string($keys))
		{
			if ($keys == '*') {return $keys;}

			return '"'.trim($keys, '"').'"';
		}
	}
}
