class Algorithms {
	constructor(element) {
		this.$el = element;
	}

	init() {
		var editor = ace.edit("editor");
	    editor.setTheme("ace/theme/twilight");
	    editor.session.setMode("ace/mode/javascript");
	}
}

var instance = new Algorithms($('#algorithms-container'));
$('#algorithms-container').data('Algorithms', instance);
instance.init();

//# sourceURL=js/modules/Algorithms/Algorithms.js