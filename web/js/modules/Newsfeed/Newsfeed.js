class Newsfeed {
	constructor(element) {
		this.$el     = element;
		this.nfTimer = null;
		this.unseen  = 0;
	}

	init() {
		this.$el.on('click', '#newsfeed-expand-collapse-button', $.proxy(this.onExpandCollapseButton, this));
		
		this.$el.find('#newsfeed-expand-collapse-button').trigger('click');

		Utility.Events.on('login', $.proxy(this.onLogin, this));
	}

	onLogin() {
		Utility.Data.get('notification',  $.proxy(this.onGetNotificationsSuccess, this));
		Utility.Events.on('notification', $.proxy(this.insertNotification,        this));

		// Start update timer
		if (this.nfTimer) {return;}
		setTimeout($.proxy(this.updateTimes, this), 60 * 1000);
	}

	updateTimes() {
		var $rows = this.$el.find('#notification-container').find('.notification-row');
		for (var ct = 0; ct < $rows.length; ct++) {
			var $row = $($rows[ct]);
			$row.find('.notification-row-time').text(moment($row.data('notificationData').unix_time*1000).from(moment()));
		}
	}

	onGetNotificationsSuccess(data) {
		for (var ct = 0; ct < data.length; ct++) {
			this.insertNotification(data[ct], false);
		}
	}

	insertNotification(notificationData, showFlash) {
		// Show flash for new notifications if collapsed
		if (showFlash !== false && $('#newsfeed-expand-collapse-button i').hasClass('fa-plus')) {
			$('.newsfeed-counter').show();
			$('.newsfeed-counter').text(++this.unseen);
			$('#newsfeed-container,#newsfeed-expand-collapse-button').addClass('flash');
			window.document.title = '('+this.unseen+') Cryp.to';

			setTimeout(function() {$('#newsfeed-container,#newsfeed-expand-collapse-button').removeClass('flash');}, 3000)
		}

		// If it exists don't add it again just update it's data since it may have changed?
		var existing = this.$el.find('#notification_'+notificationData.notification_id);
		if (existing.length) {existing.data('notificationData', notificationData);return;}

		var $notificationContainer = this.$el.find('#notification-container');

		// Create the notification row
		var $newRow = $(this.$el.find('#notification-row-container').html());
		$newRow.find('.notification-row-time').text(moment(notificationData.unix_time*1000).from(moment()));
		$newRow.find('.notification-row-text').text(notificationData.text);
		$newRow.data('notificationData', notificationData);

		// Find out where abouts it should be added
		if (!$notificationContainer.find('.notification-row').length) {$notificationContainer.append($newRow);this.colorifyRows();return;}
		var $before = null;
		for (var ct = 0; ct < $notificationContainer.find('.notification-row').length; ct++) {
			var $current = $($notificationContainer.find('.notification-row')[ct]);
			if ($current.data('notificationData').unix_time < notificationData.unix_time) {
				$before = $current;
			}
		}
		if (!$before) {$notificationContainer.append($newRow);this.colorifyRows();return;}
		$newRow.insertAfter($before);
		this.colorifyRows();
	}

	colorifyRows() {
		var $rows = this.$el.find('#notification-container').find('.notification-row');
		for (var ct = 0; ct < $rows.length; ct++) {
			var $row = $($rows[ct]);
			$row.removeClass('notification-row-even');
			$row.removeClass('notification-row-odd');
			if (ct%2) {$row.addClass('notification-row-odd'); }
			else      {$row.addClass('notification-row-even');}
		}
	}

	onExpandCollapseButton(evt) {
		var $button = $(evt.target);
		if ($button.is('i')) {$button = $button.parent('div');}
		if ($button.find('i').hasClass('fa-minus')) {
			$button.find('i').removeClass('fa-minus');
			$button.find('i').addClass('fa-plus');
			$('#newsfeed-container').css('right', '-290px');
		}
		else {
			$button.find('i').removeClass('fa-plus');
			$button.find('i').addClass('fa-minus');
			$('#newsfeed-container').css('right', '0px');

			$('.newsfeed-counter').hide();
			$('.newsfeed-counter').text('0');
			this.unseen = 0;
			window.document.title = 'Cryp.to';
		}
	}
}

var instance = new Newsfeed($('#newsfeed-container'));
$('#newsfeed-container').data('Newsfeed', instance);
instance.init();

//# sourceURL=js/modules/Newsfeed/Newsfeed.js