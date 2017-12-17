class Algorithms {
	constructor(element) {
		this.$el = element;
		this.currentAlgorithm = null;
	}

	init() {
		var self = this;
		$(document).keydown(function(e) {
			var key      = undefined;
			var possible = [ e.key, e.keyIdentifier, e.keyCode, e.which ];
			while (key === undefined && possible.length > 0) {key = possible.pop();}
			if (key && (key == '115' || key == '83' ) && (e.ctrlKey || e.metaKey) && !(e.altKey))
			{
				e.preventDefault();
				self.onSaveAlgorithmsButtonClick();
				return false;
			}
			return true;
		}); 

		var editor             = ace.edit("algorithms-editor");
		editor.$blockScrolling = Infinity;
	    editor.setTheme("ace/theme/twilight");
	    editor.session.setMode("ace/mode/javascript");
	    this.$el.data('algorithms-editor', editor);

	    editor.on('change', $.proxy(this.onAlgorithmUpdate, this));

	    this.$el    .on('click',  '#algorithms-add',          $.proxy(this.onAddAlgorithmsButtonClick,    this));
	    this.$el    .on('click',  '#algorithms-delete',       $.proxy(this.onDeleteAlgorithmsButtonClick, this));
	    this.$el    .on('click',  '#algorithms-save',         $.proxy(this.onSaveAlgorithmsButtonClick,   this));
	    this.$el    .on('click',  '.algorithm-button',        $.proxy(this.onAlgorithmButtonClick,        this));
	    this.$el    .on('click',  '#run-algorithm-button',    $.proxy(this.onRunButtonClick,              this));
	    this.$el    .on('change', '#algorithm-run-frequency', $.proxy(this.onAlgorithmSelect,             this));
	    Utility.Data.on('post',   'algorithm',                $.proxy(function() {Utility.Data.get('algorithm', $.proxy(this.onGetAlgorithmsSuccess, this), null, true);},this));
	    Utility.Data.on('delete', 'algorithm',                $.proxy(function() {Utility.Data.get('algorithm', $.proxy(this.onGetAlgorithmsSuccess, this), null, true);},this));

	    Utility.Data.get('algorithm', $.proxy(this.onGetAlgorithmsSuccess, this));
	}

	onAlgorithmSelect() {
		this.currentAlgorithm.run_frequency = this.$el.find('#algorithm-run-frequency').val();
	}

	onRunButtonClick() {
		// Get algorithm id
		if (!this.currentAlgorithm) {return;}
		var algID = this.currentAlgorithm.algorithm_id;

		$.ajax({
			type:     'GET',
			url:      '/algorithm/run/'+algID,
			success:  $.proxy(onRunResponse, this),
			dataType: 'json'
		});

		function onRunResponse(response) {
			if (typeof response.data == 'object') {response.data = JSON.stringify(response.data);}
			Utility.Modal.alert(response.data, response.msg);
		}
	}

	onDeleteAlgorithmsButtonClick() {
		Utility.Data.delete('algorithm/'+this.currentAlgorithm.algorithm_id, $.noop);
	}

	onSaveAlgorithmsButtonClick() {
		// Make sure an algorithm is selected and that we are on the algorithms page
		if (!this.currentAlgorithm || !$('#algorithms-tab').hasClass('active')) {return;}

		Utility.Data.post('algorithm/'+this.currentAlgorithm.algorithm_id, $.noop, {json_record: JSON.stringify(this.currentAlgorithm)});
	}

	onAlgorithmUpdate() {
		if (!this.currentAlgorithm) {return;}
		var text = this.$el.data('algorithms-editor').getValue();
		this.currentAlgorithm.text = text;
	}

	onAlgorithmButtonClick(evt) {
		this.$el.find('.algorithm-button').removeClass('btn-default').removeClass('btn-primary').addClass('btn-default');
		var $button = $(evt.target);
		$button.removeClass('btn-default').addClass('btn-primary');
		this.currentAlgorithm = $button.data('algorithmData');
		this.$el.find('#algorithm-run-frequency').val(this.currentAlgorithm.run_frequency);

		this.$el.data('algorithms-editor').setValue($button.data('algorithmData').text || '', -1);
	}

	onAddAlgorithmsButtonClick() {
		var $modal = Utility.Modal.prompt('Add New Algorithm', null, onNewAlgorithmSuccess);

		function onNewAlgorithmSuccess(name) {
			if (!name) {return;}

			var algorithms = Utility.Data.cache.algorithm.data;
			var bFound     = false;
			for (var ct = 0; ct < algorithms.length; ct ++) {
				if (algorithms[ct].name == name) {bFound = true;}
			}
			if (bFound) {Utility.Alert.error('Algorithm already exists, please choose another name.');return false;}
			Utility.Data.post('algorithm', $.noop, {json_record: JSON.stringify({name: name})});
		}
	}

	onGetAlgorithmsSuccess(data) {
		var $selector         = $('#algorithms-selector', this.$el);
		this.currentAlgorithm = null;
		this.$el.data('algorithms-editor').setValue('');
		$selector.empty();
		for (var ct = 0; ct < data.length; ct++) {
			$selector.append($('<button class="algorithm-button btn btn-default">').text(data[ct].name).data('algorithmData', data[ct]));
		}
		if ($selector.find('button').length) {$($selector.find('button')[0]).trigger('click');}
	}
}

var instance = new Algorithms($('#algorithms-container'));
$('#algorithms-container').data('Algorithms', instance);
instance.init();

//# sourceURL=js/modules/Algorithms/Algorithms.js