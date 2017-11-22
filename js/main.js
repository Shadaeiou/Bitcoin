$( document ).ready(function() {
	$.ajaxSetup({ cache: false });

	// Load start and resolution
	if (window.localStorage.bitcoin_resolution) {$('#resolution').val(window.localStorage.bitcoin_resolution);}
	if (window.localStorage.bitcoin_start)      {$('#start').val(window.localStorage.bitcoin_start);          }

	$('#resolution').on('change', updateResolution);
	$('#start').on('change', updateResolution);
	$('#newsfeed-expand-collapse').on('click', expandCollapseNF);
	$('#config').on('click', expandCollapseConfig);
    startApplication();
});

function expandCollapseConfig(evt) {
	var $button = $(evt.target);
	$('.config-form').toggle();
	$('.config-form').css('left', ($button.offset().left + ($button.width() / 2)) - ($('.config-form').width() / 2));
}

function expandCollapseNF (evt) {
	var $button = $(evt.target);
	if ($button.text() == '+') {
		$button.text('-');
		$('#newsfeed-container').show();
	}
	else {
		$button.text('+');
		$('#newsfeed-container').hide();
	}
}

function startApplication() {
	loadWallet();
	setInterval(function(){
		loadWallet();
	}, 60000);
}

function loadWallet() {
	$.getJSON('wallet.txt', function(data) {
		$('#wallet').text('$'+data.plus_minus);
		loadTransactions();
	});
}

function loadTransactions() {
	var $transactionContainer = $('#newsfeed-container');
	var plusMinus             = 0;
	$transactionContainer.empty();

	$.getJSON('transactions.txt', function(transactions) {
		$.each(transactions, function(index, transaction) {
			var $transactionDiv = $($('#transaction-row-container').html());

			$transactionDiv.css('backgroundColor', ((transaction.active) ? 'green' : 'red'));

            $transactionDiv.find('.transaction-time').text(moment.unix(transaction.unix).format('LLLL'));
            $transactionDiv.find('.transaction-price').text('$'+transaction.price_paid);
            $transactionDiv.find('.transaction-needed').text('$'+transaction.price_needed);
            $transactionDiv.find('.transaction-spent').text('$'+transaction.money_spent);

            if (!transaction.active) {
            	plusMinus += (transaction.money_sold - transaction.money_spent);
            	$transactionDiv.find('.transaction-sold').text('$'+transaction.money_sold);
            	$transactionDiv.find('.transaction-sold').parent().show();
            }
            
			$transactionContainer.append($transactionDiv);

			window.transactions = transactions;
		});

		$('#plus_minus').text(((plusMinus < 0) ? '$-' : '$+') + Math.round(plusMinus*100) / 100).css('color', ((plusMinus < 0) ? 'red' : 'green')).css('fontWeight', 'bold');

		loadLog();
	});
}

function loadLog() {
	$.get('run_import_price.log', function(data) {
		var splits = data.split("\n");
		window.bc_current_interval = 0;
		window.logs = [];
		$('#log-line').prop('title', data);
		for (var ct = 0; ct < splits.length; ct++) {if (splits[ct]) {window.logs.push(splits[ct]);}}

		if (!window.bc_interval) {
			window.bc_interval = setInterval(startBanner, 3000);
		}

		loadChart();
	});
}

function startBanner() {
	$('#log-line').text(window.logs[window.bc_current_interval]);
	if (window.logs.length - 1 == window.bc_current_interval) {window.bc_current_interval = -1;}
	window.bc_current_interval++;
}

function loadChart() {
	$.getJSON('prices.txt', function(data) {
		var labels     = [];
		var buyData    = [];
		var sellData   = [];
		var tfHrAvg    = [];
		var fiveMinAvg = [];
		var resolution = $('#resolution').val() ? $('#resolution').val() : 1;
		for (var ct = 0; ct < data.length; ct++) {
			labels.push(data[ct].unix*1000);
			buyData.push(data[ct].bc_buy);
			sellData.push(data[ct].bc_sell);
			tfHrAvg.push(data[ct].buy_avg);
			fiveMinAvg.push(data[ct]['smooth_buy_avg']);
		}

		// Create buy and sell marks on chart
		var lowestPriceNeed = 9999999;
		var transactions = window.transactions;
		var annotations  = [];
		for (var ct2 = 0; ct2 < transactions.length; ct2++) {
			if (transactions[ct2].active && transactions[ct2].price_needed < lowestPriceNeed) {lowestPriceNeed = transactions[ct2].price_needed;}
		}

		annotations.push({
            drawTime: "afterDatasetsDraw",
            id: "hline0",
            type: "line",
            mode: "horizontal",
            scaleID: "y-axis-0",
            value: data[data.length - 1].price_needed,
            borderColor: "black",
            borderWidth: 2,
            label: {
				backgroundColor: "black",
				content: "Price Needed ($"+data[data.length - 1].price_needed+")",
				enabled: true
            }
		});

		if (lowestPriceNeed != 9999999) {
			annotations.push({
	            drawTime: "afterDatasetsDraw",
	            id: "hline1",
	            type: "line",
	            mode: "horizontal",
	            scaleID: "y-axis-0",
	            value: lowestPriceNeed,
	            borderColor: "red",
	            borderWidth: 2,
	            label: {
					backgroundColor: "red",
					content: "Lowest Sell Line ($"+lowestPriceNeed+")",
					enabled: true
	            }
			});
		}

		annotations.push({
            drawTime: "afterDatasetsDraw",
            id: "hline2",
            type: "line",
            mode: "horizontal",
            scaleID: "y-axis-0",
            value: data[data.length - 1].smallest,
            borderColor: "purple",
            borderWidth: 2,
            label: {
				backgroundColor: "purple",
				content: "Smallest ($"+data[data.length - 1].smallest+")",
				enabled: true
            }
		});

		var ctx   = document.getElementById("myChart").getContext('2d');
		if (window.chart) {
			window.chart.data.labels                    = labels;
			window.chart.data.datasets[0].data          = buyData;
			window.chart.data.datasets[1].data          = sellData;
			window.chart.data.datasets[2].data          = tfHrAvg;
			window.chart.data.datasets[3].data          = fiveMinAvg;
			window.chart.options.annotation.annotations = annotations;
			window.chart.update();
		}
		else {
			window.chart = new Chart(ctx, {
			    type: 'line',
				data: {
					labels:   labels,
					datasets: [
					    {
					      	label:       'Buy',
					      	data:        buyData,
							borderWidth: 1,
							borderColor: 'black',
							fill: null
						},
					    {
					      	label:       'Sell',
					      	data:        sellData,
							borderWidth: 1,
							borderColor: 'red',
							fill: null
						},
					    {
					      	label:       'Main Avg.',
					      	data:        tfHrAvg,
							borderWidth: 1,
							borderColor: 'purple',
							fill: null
						},
					    {
					      	label:       'Smoothing Avg.',
					      	data:        fiveMinAvg,
							borderWidth: 1,
							borderColor: 'green',
							fill: null
						}
					]
				},
				options: {
				    tooltips: {
						mode: 'index',
						intersect: false
				    },
					animation: {
			            onComplete: function(animation) {
						    var ctx          = this.chart.ctx;
						    ctx.font         = '15px "Helvetica Neue", Helvetica, Arial, sans-serif';
						    ctx.fillStyle    = 'rgb(0,0,0)';
						    ctx.textAlign    = "center";
						    ctx.textBaseline = "bottom";

						    // Set buy, sell, and avg labels
						    var buyPtVal     = this.config.data.datasets[0].data[this.config.data.datasets[0].data.length - 1];
						    var buyPt        = this.chart.getDatasetMeta(0).data[this.chart.getDatasetMeta(0).data.length - 1]._model;
						    var sellPtVal    = this.config.data.datasets[1].data[this.config.data.datasets[1].data.length - 1];
						    var sellPt       = this.chart.getDatasetMeta(1).data[this.chart.getDatasetMeta(1).data.length - 1]._model;
						    var avgVal       = this.config.data.datasets[2].data[this.config.data.datasets[2].data.length - 1];
						    var avgPt        = this.chart.getDatasetMeta(2).data[this.chart.getDatasetMeta(2).data.length - 1]._model;
							ctx.fillText('$'+buyPtVal,  buyPt.x - 20,  buyPt.y  - 10);
							ctx.fillStyle    = 'red';
							ctx.fillText('$'+sellPtVal, sellPt.x - 20, sellPt.y - 10);
							ctx.fillStyle    = 'purple';
							ctx.fillText('$'+avgVal,    avgPt.x - 20,  avgPt.y - 10 );

							// Set buy and sell transactions
							for (var ct3 = 0; ct3 < transactions.length; ct3++) {
								var active    = transactions[ct3].active;
								var unix      = transactions[ct3].unix*1000;
								var pricePaid = transactions[ct3].price_paid;
								var bought    = transactions[ct3].money_spent;
								var sellPrice = transactions[ct3].sell_price;
								var moneySold = transactions[ct3].money_sold;
								var diff      = moneySold - transactions[ct3].money_spent;
								diff          = Math.round(diff*100) / 100;
								if (diff > 0) {diff = '+'+diff;}
								var found     = null;
								var before    = null;
								for (var ct4 = 0; ct4 < this.config.data.labels.length; ct4++) {
									if (this.config.data.labels[ct4] < unix)                   {before = true;            }
									if (this.config.data.labels[ct4] > unix && before == true) {found = ct4;before = null;}
								}
								if (found) {
									if (active) {
										var buyPt     = this.chart.getDatasetMeta(0).data[found]._model;
										ctx.fillStyle =  'black';
										ctx.fillText('Bought $'+bought+' ($'+pricePaid+')', buyPt.x, buyPt.y - 10);	
									}
									else {
										var sellPt    = this.chart.getDatasetMeta(1).data[found]._model;
										ctx.fillStyle =  'red';
										ctx.fillText('Sold $'+diff+' ($'+sellPrice+')', sellPt.x, sellPt.y - 10);
									}
								}
							}
			            }
			        },
				    elements: { point: { radius: 0 } },
				    scales: {
				      yAxes: [{
				        scaleLabel: {
				          display: true
				        }
				      }],
				      xAxes: [{
				        type: 'time',
				        autoSkip: false,
				        time: {
				        	tooltipFormat: 'h:mm a',
				        	displayFormats: {
		                        quarter: 'h:mm a'
		                    }
				        },
				        scaleLabel: {
				          display: true
				        },
				      }]
				    },
				    annotation: {annotations: annotations}
				}
			});
		}

		window.ogLabels     = labels;
		window.ogBuyData    = buyData;
		window.ogSellData   = sellData;
		window.ogTfHrAvg    = tfHrAvg;
		window.ogFiveMinAvg = fiveMinAvg;

		updateResolution();
	});
}

function updateResolution() {
	var res           = $('#resolution').val() ? $('#resolution').val()*1 : 1;
	var start         = $('#start').val() ? $('#start').val()*1 : 1440;

	// Save start and resolution
	window.localStorage.bitcoin_resolution = res;
	window.localStorage.bitcoin_start      = start;

	var labels        = window.ogLabels;
	var buyData       = window.ogBuyData;
	var sellData      = window.ogSellData;
	var tfHrAvg       = window.ogTfHrAvg;
	var fiveMinAvg    = window.ogFiveMinAvg;
	var newLabels     = [];
	var newBuyData    = [];
	var newSellData   = [];
	var newTfHrAvg    = [];
	var newFiveMinAvg = [];
	for (var ct = 0; ct < labels.length; ct++) {
		if (ct%res === 0) {
			newLabels.push(labels[ct]);
			newBuyData.push(buyData[ct]);
			newSellData.push(sellData[ct]);
			newTfHrAvg.push(tfHrAvg[ct]);
			newFiveMinAvg.push(fiveMinAvg[ct]);
		}
	}

	// Limit points with start
	var newNewLabels     = [];
	var newNewBuyData    = [];
	var newNewSellData   = [];
	var newNewTfHrAvg    = [];
	var newNewFiveMinAvg = [];
	var startAgain       = Math.max(0, newLabels.length - start);
	for (; startAgain < newLabels.length; startAgain++) {
		newNewLabels.push(newLabels[startAgain]);
		newNewBuyData.push(newBuyData[startAgain]);
		newNewSellData.push(newSellData[startAgain]);
		newNewTfHrAvg.push(newTfHrAvg[startAgain]);
		newNewFiveMinAvg.push(newFiveMinAvg[startAgain]);
	}

	window.chart.data.labels           = newNewLabels;
	window.chart.data.datasets[0].data = newNewBuyData;
	window.chart.data.datasets[1].data = newNewSellData;
	window.chart.data.datasets[2].data = newNewTfHrAvg;
	window.chart.data.datasets[3].data = newNewFiveMinAvg;
	window.chart.update();
}
