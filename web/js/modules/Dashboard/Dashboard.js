class Dashboard {
	constructor(element) {
		this.$el = element;
	}

	init() {
		
	}
}

var instance = new Dashboard($('#dashboard-container'));
$('#dashboard-container').data('Dashboard', instance);
instance.init();

//# sourceURL=js/modules/Dashboard/Dashboard.js