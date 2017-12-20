$(document).ready(function() {
	$.ajaxSetup({ cache: false });

	// Load our modules
	Utility.Module.launch('Dashboard',  '#dashboard-container' );
	Utility.Module.launch('Algorithms', '#algorithms-container');
	Utility.Module.launch('Wallets',    '#wallets-container'   );
	Utility.Module.launch('Newsfeed',   '#newsfeed-container'  );

	$(document).on('click', '.navbar-nav li',          $.proxy(changeTab,             this)                  );
	$(document).on('click', '#collapse-menu',          $.proxy(collapseMenu,          this)                  );
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

function collapseMenu() {
	$('.navbar-nav').toggle();
	if ($('#collapse-menu i').hasClass('fa-arrow-left')) {
		$('#collapse-menu i').removeClass('fa-arrow-left');
		$('#collapse-menu i').addClass('fa-arrow-right');
		$('#collapse-menu').removeClass('collapse-me');
		$('#collapse-menu').addClass('expand-me');
		$('#main-container').css('marginLeft', '0px');
		$('footer').css('marginLeft', '45px');
	}
	else {
		$('#collapse-menu i').removeClass('fa-arrow-right');
		$('#collapse-menu i').addClass('fa-arrow-left');
		$('#collapse-menu').removeClass('expand-me');
		$('#collapse-menu').addClass('collapse-me');
		$('#main-container').css('marginLeft', '200px');
		$('footer').css('marginLeft', '200px');
	}
}

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

	window.UserData = response.data;

	$('.fa-user-circle, .fa-caret-down').css('color', 'green');
	$('#sign-in-button').toggle();
	$('#sign-up-button').toggle();
	$('#sign-out-button').toggle();
	$('#edit-profile').toggle();
	$('#welcome-message').toggle();
	$('#algorithms-tab').toggle();
	$('#wallets-tab').toggle();
	$('#newsfeed-container').toggle();

	$('#login-container').fadeOut();

	Utility.Socket.connect();

	Utility.Socket.pair('new_price',                                   'new_price'         );
	Utility.Socket.pair('algorithm_response_'+window.UserData.user_id, 'algorithm_response');
	Utility.Socket.pair('notification_'+window.UserData.user_id,       'notification'      );

	Utility.Events.trigger('login');
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

//# sourceURL=js/main.js