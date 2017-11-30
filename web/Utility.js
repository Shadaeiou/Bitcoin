(function(Utility) {
	Utility.Module = {
		launch: function(config, target) {
			if (config === (config+'')) {config = {path: config};}
			var name       = config.path.split('/').pop();
			var path       = config.path;
			var file       = 'modules/'+(path||name)+'/'+name+'.html';
			config.options = config.options || {};
			var $target    = target ? $(target) : $('#main-container');
			$.get(file, function(html) {$target.append(html);}, 'html').error(function(xhr, status, error) {
				Utility.Notify.error('Load Error', 'There was an error loading '+name+'.');
			});
		}
	};
}(window.Utility = window.Utility || {}));