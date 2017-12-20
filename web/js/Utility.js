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
			var top = 50;
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

		prompt: function(title, msg, callback, defaultValue) {
			if (msg instanceof $) {msg = msg.html();}
			return bootbox.prompt({
				title: title,
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
				},
				callback: callback
			});
		},

		dialog: function(title, msg, callback, defaultValue) {
			if (msg instanceof $) {msg = msg.html();}
			return bootbox.dialog({
				title: title,
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
				},
				callback: callback
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

	Utility.Data = {
		cache:  {},
		events: {},
		success: function(response, callback, cache, type, fullResponse) {
			if (!response || !response.success) {Utility.Alert.error(response.msg || 'There was an error, please try again.');return;}

			this.cache[cache] = response;

			if (fullResponse) {callback(response);     }
			else              {callback(response.data);}

			type = type.toLowerCase();
			cache = cache.split('/')[0];
			if (!this.events[cache] || !this.events[cache][type]) {return;}
			for (var ct = 0; ct < this.events[cache][type].length; ct++) {
				this.events[cache][type][ct].call();
			}
		},
		initCall: function(callback, endPoint, type, data, fullResponse, refreshCache) { 
			if (!refreshCache && this.cache[endPoint]) {if (fullResponse) {callback(this.cache[endPoint]);} else {callback(this.cache[endPoint]['data']);}return;}
			if (!type)                                 {type = 'GET';}

			$.ajax({
				type:     type,
				url:      '/'+endPoint,
				data:     data,
				success:  function(response) {Utility.Data.success(response, callback, endPoint, type, fullResponse)},
				dataType: 'json'
			});
		},
		on: function(action, endPoint, callback) {
			action = action.toLowerCase();
			if (!this.events[endPoint])         {this.events[endPoint]         = {};}
			if (!this.events[endPoint][action]) {this.events[endPoint][action] = [];}
			this.events[endPoint][action].push(callback);
		},
		get: function(endPoint, callback, fullResponse, refreshCache) {
			this.initCall(callback, endPoint, 'GET', null, fullResponse, refreshCache);
		},
		post: function(endPoint, callback, data, fullResponse) {
			this.initCall(callback, endPoint, 'POST', data, fullResponse, true);
		},
		delete: function(endPoint, callback, fullResponse) {
			this.initCall(callback, endPoint, 'DELETE', null, fullResponse, true);
		}
	};

	Utility.Socket = {
		connection: null,
		connect: () => {
			Utility.Socket.connection = window.io();
		},
		pair: (socketName, internalName) => {
			Utility.Socket.connection.on(socketName, function(data) {Utility.Events.trigger(internalName, data);})
		}
	}

	Utility.Events = {
		events: {},
		on: function(eventName, callback) {
			eventName = eventName.toLowerCase();
			if (!Utility.Events.events[eventName]) {Utility.Events.events[eventName] = [];}
			Utility.Events.events[eventName].push(callback);
		},
		trigger: function(eventName, data) {
			if (!Utility.Events.events[eventName] || !Utility.Events.events[eventName].length) {return;}
			for (var ct = 0; ct < Utility.Events.events[eventName].length; ct++) {
				Utility.Events.events[eventName][ct].call(this, data);
			}
		}
	}
}(window.Utility = window.Utility || {}));

//# sourceURL=js/Utility.js