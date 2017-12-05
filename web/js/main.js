$(document).ready(function() {
	$.ajaxSetup({ cache: false });

	// Load our modules
	Utility.Module.launch('Dashboard',  '#dashboard-container' );
	Utility.Module.launch('Algorithms', '#algorithms-container');
	Utility.Module.launch('Wallets',    '#wallets-container'   );

	$(document).on('click', '.navbar-nav li',          $.proxy(changeTab,             this)                  );
	$(document).on('click', '#sign-in-button',         $.proxy(onLoginButtonClick,    this)                  );
	$(document).on('click', '#sign-up-button',         $.proxy(onRegisterButtonClick, this)                  );
	$(document).on('click', '#login-x',                function(){$('#login-container').fadeOut();}          );
	$(document).on('click', '#login-submit-button',    $.proxy(onLogin, this)                                );
	$(document).on('keyup', '#login-email',            function(evt) {if (evt.keyCode == 13) {onLogin();}}   );
	$(document).on('keyup', '#login-password',         function(evt) {if (evt.keyCode == 13) {onLogin();}}   );

	$(document).on('click', '#login-register-button',  $.proxy(onRegisterButtonClick, this)                  );
	$(document).on('click', '#register-x',             function(){$('#register-container').fadeOut();}       );
	$(document).on('click', '#register-submit-button', $.proxy(onRegister, this)                             );
	$(document).on('keyup', '#register-last-name',     function(evt) {if (evt.keyCode == 13) {onRegister();}});

	$(document).on('click', '#sign-out-button',        $.proxy(onLogoutButtonClick,    this)                 );

	// Auto login
	$('#login-email').val('burke.blazer@gmail.com');
	$('#login-password').val('bblazer');
	onLogin();
});

function changeTab(evt) {
	var tab     = $(evt.target).parents('li');
	var tabText = tab.find('span').text();
	$('.navbar li').removeClass('active');
	tab.addClass('active');

	$('.tab-container').hide();

	if (tabText == 'Dashboard') {
		$('#dashboard-container').show();
	}
	else if (tabText == 'Algorithms') {
		$('#algorithms-container').show();
	}
	else if (tabText == 'Wallets') {
		$('#wallets-container').show();
		$('#wallets-container').data('Wallets').activate();
	}
}

function onRegisterButtonClick(evt) {
	$('#register-container').fadeIn();
}

function onRegister() {
	var email = $('#register-email')           .val();
	var pw    = $('#register-password')        .val();
	var cpw   = $('#register-confirm-password').val();
	var fn    = $('#register-first-name')      .val();
	var ln    = $('#register-last-name')       .val();

	if (!email)     {Utility.Alert.error('Please enter an email.');                return;}
	if (!pw)        {Utility.Alert.error('Please enter a password.');              return;}
	if (!cpw)       {Utility.Alert.error('Please confirm your password.');         return;}
	if (cpw !== pw) {Utility.Alert.error('Please make sure your passwords match.');return;}
	if (!fn)        {Utility.Alert.error('Please enter a first name.');            return;}
	if (!ln)        {Utility.Alert.error('Please enter a last name.');             return;}

	$.ajax({
		type:     'POST',
		url:      '/user/register',
		data:     {json_record: JSON.stringify({email: email, password: pw, first_name: fn, last_name: ln})},
		success:  onRegisterSuccess,
		dataType: 'json'
	});
}

function onRegisterSuccess(response) {
	if (!response || !response.success) {Utility.Alert.error(response.msg || 'There was an error registering, please try again.');return;}

	$('#register-container').fadeOut();
}

function onLoginButtonClick(evt) {
	$('#login-container').fadeIn();
}

function onLogin() {
	var email = $('#login-email').val();
	var pass  = $('#login-password').val();

	if (!email) {Utility.Alert.error('Please enter an email.');  return;}
	if (!pass)  {Utility.Alert.error('Please enter a password.');return;}

	$.ajax({
		type:     'POST',
		url:      '/user/login',
		data:     {email: email, password: pass},
		success:  onLoginSuccess,
		dataType: 'json'
	});
}

function onLoginSuccess(response) {
	if (!response || !response.success) {Utility.Alert.error(response.msg || 'There was an error logging in, please try again.');return;}

	$('#welcome-message').text('Welcome '+response.data.name+'!');

	$('.fa-user-circle, .fa-caret-down').css('color', 'green');
	$('#sign-in-button').toggle();
	$('#sign-up-button').toggle();
	$('#sign-out-button').toggle();
	$('#edit-profile').toggle();
	$('#welcome-message').toggle();
	$('#algorithms-tab').toggle();
	$('#wallets-tab').toggle();

	$('#login-container').fadeOut();
}

function onLogoutButtonClick() {
	$.ajax({
		type:     'POST',
		url:      '/user/logout',
		success:  onLogoutSuccess,
		dataType: 'json'
	});
}

function onLogoutSuccess(response) {
	if (!response || !response.success) {Utility.Alert.error(response.msg || 'There was an error logging out, please try again.');return;}
	Utility.Alert.success('Successfully logged you out.');

	$('#dashboard-tab').find('a').trigger('click');

	$('#welcome-message').text('');
	$('.fa-user-circle, .fa-caret-down').css('color', 'red');
	$('#sign-in-button').toggle();
	$('#sign-up-button').toggle();
	$('#sign-out-button').toggle();
	$('#edit-profile').toggle();
	$('#welcome-message').toggle();
	$('#algorithms-tab').toggle();
	$('#wallets-tab').toggle();
}