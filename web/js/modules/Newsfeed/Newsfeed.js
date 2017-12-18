class Newsfeed {
	constructor(element) {
		this.$el = element;
	}

	init() {
		this.$el.on('click', '#newsfeed-expand-collapse-button', $.proxy(this.onExpandCollapseButton, this));
		
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
		}
	}
}

var instance = new Newsfeed($('#newsfeed-container'));
$('#newsfeed-container').data('Newsfeed', instance);
instance.init();

//# sourceURL=js/modules/Newsfeed/Newsfeed.js