!(function(window, $) {
    "use strict";

      // Required modules
     /*var chartObject = require("./chart.js"),
         registerObject = require("./register.js"),*/
         var animationDelay = 3000;

    function updateOrder (elem, isInitial, currency) {
        var val,
            rate,
            amountCoin = $('.amount-coin'),
            amountCashConfirm = 0,
            floor = 100000000;

        isInitial = isInitial || !elem.val().trim();
        val = isInitial ? elem.attr('placeholder') : elem.val();

        if (!val) {
            return;
        }

        $.get(chartObject.tickerLatestUrl, function(data) {
            // TODO: protect against NaN
            updatePrice(getPrice(data[window.ACTION_BUY], currency), $('.rate-buy'));
            updatePrice(getPrice(data[window.ACTION_SELL], currency), $('.rate-sell'));
            rate = data[window.action]['price_' + currency + '_formatted'];
            if (elem.hasClass('amount-coin')) {
                var cashAmount = rate * val;
                amountCashConfirm = cashAmount;
                if (isInitial) {
                    $('.amount-cash').attr('placeholder', cashAmount);
                } else {
                    $('.amount-cash').val(cashAmount);
                }
            } else {
                var btcAmount = Math.floor(val / rate * floor) / floor;
                if (isInitial) {
                    $('.amount-coin').attr('placeholder', btcAmount);
                } else {
                    $('.amount-coin').val(btcAmount);
                }
            }
            $('.btc-amount-confirm').text(amountCoin.val()); // add
            $('.cash-amount-confirm').text(amountCashConfirm); //add
        });
    }

    //order.js

    function updatePrice (price, elem) {
        var currentPriceText = elem.html().trim(),
            currentPrice,
            isReasonableChange;

        if (currentPriceText !== '') {
            currentPrice = parseFloat(currentPriceText);
        } else {
            elem.html(price);
            return;
        }
        // TODO: refactor this logic
        isReasonableChange = price < currentPrice * 1.05;
        if (currentPrice < price && isReasonableChange) {
            animatePrice(price, elem, true);
        }
        else if (!isReasonableChange) {
            setPrice(elem, price);
        }

        isReasonableChange = price * 1.05 > currentPrice;
        if (currentPrice > price && isReasonableChange) {
            animatePrice(price, elem);
        }
        else if (!isReasonableChange) {
            setPrice(elem, price);
        }
    }

    // order.js
    function animatePrice (price, elem, isRaise) {
        var animationClass = isRaise ? 'up' : 'down';
        elem.addClass(animationClass).delay(animationDelay).queue(function (next) {
                        setPrice(elem, price).delay(animationDelay / 2).queue(function(next) {
                elem.removeClass(animationClass);
                next();
            });
            next();
        });
    }

    //order.js
    function getPrice (data, currency) {
        return data['price_' + currency + '_formatted'];
    }

    function setCurrency (elem, currency) {
        if (elem && elem.hasClass('currency_pair')) {
            $('.currency_to').val(elem.data('crypto'));

        }

        $('.currency').html(currency.toUpperCase());
        chartObject.renderChart(currency, $("#graph-range").val());
    }

    function setPrice(elem, price) {
        elem.each(function () {
            if ($(this).hasClass('amount-cash')) {
                price = price * $('.amount-coin');
                price = Math.round(price * 100) / 100;
            } else {
                $(this).html(price);
            }
        });

        return elem;
    }

    function setButtonDefaultState (tabId) {
        if (tabId === 'menu2') {
            var modifier = window.ACTION_SELL ? 'btn-danger' : 'btn-success';
            $('.next-step').removeClass('btn-info').addClass(modifier);
        } else {
            $('.next-step').removeClass('btn-success').removeClass('btn-danger').addClass('btn-info');
        }
        $('.btn-circle.btn-info')
            .removeClass('btn-info')
            .addClass('btn-default');
    }

    function toggleBuyModal () {
        $("#PayMethModal").modal('toggle');
    }

    function toggleSellModal () {
        $("#card-form").card({
            container: '.card-wrapper',
            width: 200,
            placeholders: {
                number: '???????????? ???????????? ???????????? ????????????',
                name: 'Ivan Ivanov',
                expiry: '??????/??????',
                cvc: '?????????'
            }
        });
        $("#UserAccountModal").modal({backdrop: "static"});
    }

    function changeState (action) {
        if ( $(this).hasClass('disabled') ) {// jshint ignore:line
            //todo: allow user to buy placeholder value or block 'next'?
            return;
        }

        if (!$('.payment-preference-confirm').html().trim()) {
            if (window.action == window.ACTION_BUY){
                toggleBuyModal();
            } else {
                toggleSellModal();
            }
            return;
        }

        var valElem = $('.amount-coin'),
            val;
        if (!valElem.val().trim()) {
            //set placeholder as value.
            val = valElem.attr('placeholder').trim();
            valElem.val(val).trigger('change');
            $('.btc-amount-confirm').html(val);
        }

        var paneClass = '.tab-pane',
            tab = $('.tab-pane.active'),
            action = action || $(this).hasClass('next-step') ? 'next' : 'prev',// jshint ignore:line
            nextStateId = tab[action](paneClass).attr('id'),
            nextState = $('[href="#'+ nextStateId +'"]'),
            nextStateTrigger = $('#' + nextStateId),
            menuPrefix = "menu",
            numericId = parseInt(nextStateId.replace(menuPrefix, '')),
            currStateId = menuPrefix + (numericId - 1),
            currState =  $('[href="#'+ currStateId +'"]');

        //skip disabled state, check if at the end
        if(nextState.hasClass('disabled') &&
            numericId < $(".process-step").length &&
            numericId > 1) {
            changeState(action);
        }


        if (nextStateTrigger.hasClass('hidden')) {
            nextStateTrigger.removeClass('hidden');
        }


        if ( !registerObject.canProceedtoRegister(currStateId) ){
            $('.trigger-buy').trigger('click', true);
        } else {
            setButtonDefaultState(nextStateId);
            currState.addClass('btn-success');
            nextState
                .addClass('btn-info')
                .removeClass('btn-default')
                .tab('show');
        }

        $(window).trigger('resize');
    }

function reloadRoleRelatedElements (menuEndpoint) {
        $.get(menuEndpoint, function (menu) {
            $(".menuContainer").html($(menu));
        });

        $(".process-step .btn")
            .removeClass('btn-info')
            .removeClass('disabled')
            .removeClass('disableClick')
            .addClass('btn-default');

        $(".step2 .btn")
            .addClass('btn-info')
            .addClass('disableClick')
            .addClass('disabled');
    }

    function reloadCardsPerCurrency(currency, cardsModalEndpoint) {
        $.post(cardsModalEndpoint, {currency: currency}, function (data) {
            $('.paymentSelectionContainer').html($(data));
        });
    }

    /*module.exports = {
        updateOrder: updateOrder,
        updatePrice: updatePrice,
        animatePrice: animatePrice,
        getPrice: getPrice,
        setCurrency: setCurrency,
        setPrice: setPrice,
        setButtonDefaultState: setButtonDefaultState,
        changeState: changeState,
        reloadRoleRelatedElements: reloadRoleRelatedElements,
        reloadCardsPerCurrency: reloadCardsPerCurrency,
        toggleBuyModal: toggleBuyModal,
        toggleSellModal: toggleSellModal
    };*/
}(window, window.jQuery)); //jshint ignore:line
