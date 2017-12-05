class Wallets {
	constructor(element) {
		this.activated = false;
		this.$el       = element;
	}

	init() {
		this.$table = $('#wallets-table').bootstrapTable();
		this.$el.on('click', '#wallets-crud-add-button', $.proxy(this.onAddButtonClick, this));
	}

	onAddButtonClick(evt) {
		Utility.Modal.prompt('Add Wallet', $('#wallets-add-wallet-container').html(), onAddWalletSuccess);

		function onAddWalletSuccess(response) {
			console.log(response);
		}
	}

	activate() {
		if (this.activated) {return;}
		this.activated = true;

		$.ajax({
			type:     'GET',
			url:      '/wallet',
			success:  $.proxy(onGetWalletSuccess, this),
			dataType: 'json'
		});

		function onGetWalletSuccess(response) {
			if (!response || !response.success) {Utility.Alert.error(response.msg || 'There was an error getting your wallets, please try again.');return;}

			this.$table.bootstrapTable('load', response.data);
		}
	}
}

var instance = new Wallets($('#wallets-container'));
$('#wallets-container').data('Wallets', instance);
instance.init();

//# sourceURL=js/modules/Wallets/Wallets.js