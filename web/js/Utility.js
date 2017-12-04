(function(Utility) {
	Utility.Module = {
		launch: function(config, target) {
			if (config === (config+'')) {config = {path: config};}
			var name       = config.path.split('/').pop();
			var path       = config.path;
			var file       = 'js/modules/'+(path||name)+'/'+name+'.html';
			config.options = config.options || {};
			var $target    = target ? $(target) : $('#main-container');
			$.get(file, function(html) {$target.append(html);}, 'html').error(function(xhr, status, error) {Utility.Notify.error('Load Error', 'There was an error loading '+name+'.');});
		}
	};

	Utility.Alert = {
		dialogs: {},
		success: function(msg, duration) {
			Utility.Alert.default(msg, 'success', duration);
		},

		info: function(msg, duration) {
			Utility.Alert.default(msg, 'info', duration);
		}, 

		warning: function(msg, duration) {
			Utility.Alert.default(msg, 'warning', duration);
		},

		error: function(msg, duration) {
			Utility.Alert.default(msg, 'danger', duration);
		},

		default: function(msg, type, duration) {
			if (!duration) {duration = 5000;}
			var ms     = new Date().getMilliseconds();
			var id     = moment().unix()+ms;
			var $alert = $('<div class="alert alert-'+type+'" role="alert" style="height: 50px;"><strong>'+msg+'</strong></div>');
			Utility.Alert.dialogs[id] = $alert;
			$('body').append($alert);
			Utility.Alert.realign();
			window.setTimeout(function() {
				$alert.fadeTo(500, 0).slideUp(500, function(){
				    $(this).remove();
				    delete Utility.Alert.dialogs[id];
				    Utility.Alert.realign();
				});
			}, duration);
		},

		realign: function() {
			var top = 0;
			for (var key in Utility.Alert.dialogs) {
				if (Utility.Alert.dialogs.hasOwnProperty(key)) {
					top += 5;
					Utility.Alert.dialogs[key].css('top', top+'px');
					top += 50;
				}
			}
		}
	};

	Utility.Modal = {
		alert: function(msg, header, callback, okText) {
			if (msg instanceof $) {msg = msg.html();}
			return bootbox.alert({
				message: '<form>'+msg+'</form>',
				title: header || '',
				buttons: {
					ok: {
						label: okText || 'OK',
						callback: callback
					}
				},
				callback: callback
			});
		},

		prompt: function(msg, callback, defaultValue) {
			if (msg instanceof $) {msg = msg.html();}
			return bootbox.prompt({
				message: '<form>'+msg+'</form>',
				value: defaultValue || '',
				buttons: {
					confirm: {
						label: 'OK',
						callback: callback
					},
					cancel: {
						label: 'Cancel'
					}
				}
			});
		},

		confirm: function(header, msg, callback, confirmText, cancelText) {
			if (msg instanceof $) {msg = msg.html();}
			return bootbox.confirm({
				message: '<form onsubmit="return false;">'+msg+'</form>',
				title: header || '',
				buttons: {
					confirm: {
						label: confirmText || 'OK',
						callback: callback
					},
					cancel: {
						label: cancelText || 'Cancel'
					}
				},
				callback: callback
			});
		}
	};
}(window.Utility = window.Utility || {}));