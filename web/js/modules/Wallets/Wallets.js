class Wallets {
	constructor(element) {
		this.activated = false;
		this.$el       = element;
	}

	init() {
		this.$table = $('#wallets-table').bootstrapTable();
		this.$el   .on('click', '#wallets-crud-add-button',        $.proxy(this.onAddButtonClick,     this));
		$(document).on('click', '#wallets-add-user-broker-button', $.proxy(this.onAddUserBrokerClick, this));
	}

	onAddUserBrokerClick(evt) {
		var $modal = Utility.Modal.dialog('Add User Broker', $('#wallets-add-user-broker-container').html(), onAddUserBrokerSuccess);

		Utility.Data.get('broker', onGetBrokersSuccess);
		Utility.Data.get('user_broker', $.noop);

		function onGetBrokersSuccess(data) {
			var $brokerSelect = $modal.find('#selected-broker');
			for (var ct = 0; ct < data.length; ct++) {
				$brokerSelect.append($('<option>').text(data[ct].name).val(data[ct].broker_id));
			}
		}

		function onAddUserBrokerSuccess(response) {
			if (!response) {return;}

			var name    = $modal.find('#user-broker-name').val();
			var broker  = $modal.find('#selected-broker').val();
			var config  = $modal.find('#selected-broker-config').val();
			var ubs     = Utility.Data.cache.user_broker.data;
			var bFound  = false;
			for (var ct = 0; ct < ubs.length; ct ++) {
				if (ubs[ct].name == name) {bFound = true;}
			}
			if (bFound) {Utility.Alert.error('User broker already exists, please choose another name.');return false;}
			Utility.Data.post('user_broker', $.noop, {json_record: JSON.stringify({name: name, broker_id: broker, config: config})});
		}
	}

	onAddButtonClick(evt) {
		var $modal = Utility.Modal.dialog('Add Wallet', $('#wallets-add-wallet-container').html(), onAddWalletSuccess);

		Utility.Data.get('user_broker',        onGetBrokersSuccess);
		Utility.Data.on('post', 'user_broker', onGetNewBrokersSuccess);

		function onGetNewBrokersSuccess() {
			Utility.Data.get('user_broker', onGetBrokersSuccess, null, true);
		}

		function onGetBrokersSuccess() {
			var data = Utility.Data.cache.user_broker.data;
			var $brokerSelect = $modal.find('#selected-user-broker');
			$brokerSelect.empty();
			for (var ct = 0; ct < data.length; ct++) {
				$brokerSelect.append($('<option>').text(data[ct].name).val(data[ct].user_broker_id));
			}
		}

		function onAddWalletSuccess(response) {
			if (!response) {return;}

			var name    = $modal.find('#wallet-name').val();
			var broker  = $modal.find('#selected-user-broker').val();
			var wallets = Utility.Data.cache.wallet.data;
			var bFound  = false;
			for (var ct = 0; ct < wallets.length; ct ++) {
				if (wallets[ct].name == name) {bFound = true;}
			}
			if (bFound) {Utility.Alert.error('Wallet already exists, please choose another name.');return false;}
			Utility.Data.post('wallet', $.noop, {json_record: JSON.stringify({name: name, user_broker_id: broker})});
		}
	}

	activate() {
		if (this.activated) {return;}
		this.activated = true;

		Utility.Data.get('wallet', $.proxy(onGetWalletSuccess, this));
		Utility.Data.on('post', 'wallet', $.proxy(onGetNewWalletSuccess, this));

		function onGetNewWalletSuccess() {
			Utility.Data.get('wallet', $.proxy(onGetWalletSuccess, this), null, true);
		}

		function onGetWalletSuccess(data) {
			this.$table.bootstrapTable('load', data);
		}
	}
}

var instance = new Wallets($('#wallets-container'));
$('#wallets-container').data('Wallets', instance);
instance.init();

//# sourceURL=js/modules/Wallets/Wallets.js