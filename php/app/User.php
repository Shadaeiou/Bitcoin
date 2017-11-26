<?php

class User {
	public static $current = null;

	/**
	 * Function: validate
	 *
	 */
	public static function validate($user_id) {
		$user = Utility::selectOne('*', 'user', array('user_id' => $user_id));

		// Check if the account is disabled
		if ($user['user_id'] && $user['status'] == 'f') {
			return false;
		}
		
		User::$current = $user;
		return true;
	}

	/**
	 * Function: logOut
	 *
	 *
	 * @extern true
	 */
	public static function logOut() {
		if (!User::$current) {return Utility::successFalse(null, 'There was an error logging out.');}
		session_destroy();
		Utility::update('user', array('modified' => date('c')), array('user_id' => User::$current['user_id']));
		return Utility::successTrue(null, 'Successfully logged user out.');
	}
	
	/**
	 * Function: register
	 *
	 * Parameters:
	 * $user_record
	 *
	 * Returns:
	 * standard array
	 *
	 * @extern true
	 */
	public static function register($user_record) {
		// Check if user exists
		$user = Utility::selectOne('*', 'user', array('email' => $user_record['email']));
		if ($user) {return Utility::successFalse(null, 'User is already registered.');}

		// Hash the pw
		$user_record['password'] = password_hash($user_record['password'], PASSWORD_DEFAULT);

		// Insert the user
		Utility::insertInto('user', $user_record);

		return Utility::successTrue(null, 'Successfully registered user.');
	}
	
	/**
	 * Function: logIn
	 *
	 * Parameters:
	 * $email
	 * $password
	 *
	 * Returns:
	 * standard array
	 *
	 * @extern true
	 */
	public static function logIn($email, $password) {
		$user = Utility::selectOne('*', 'user', array('email' => $email));

		// Make sure the user actually exists
		if (!$user['user_id'])                              {return Utility::successFalse(null, 'Incorrect email address or password - please try again.');}
		if ($user['user_id'] && $user['status'] == 'f')     {return Utility::successFalse(null, 'This account is currently inactive. Please contact support to activate your account.');}

		// Check pw
		if (!password_verify($password, $user['password'])) {return Utility::successFalse(null, 'Incorrect email address or password - please try again.');}

		User::$current = $user;

		// Start new session
		session_name('CryptoCurrent');
		session_start();
		$_SESSION['user_id']   = User::$current['user_id'];
		$_SESSION['user_data'] = User::$current;

		if (session_id() != '') {
			Utility::update('user', array('modified' => date('c')), array('user_id' => User::$current['user_id']));
		}

		return Utility::successTrue(User::$current);
	}
}