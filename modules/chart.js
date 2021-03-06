$(document).ready(function(){
    "use strict";

    var apiRoot = '/en/api/v1',
        chartDataRaw,
        tickerHistoryUrl = apiRoot +'/price/history',
        tickerLatestUrl = apiRoot + '/price/latest';

    function responseToChart(data) {
        var i,
            resRub = [],
            resUsd = [],
            resEur = [];

        for (i = 0; i < data.length; i+=2) {
            var sell = data[i],
            buy = data[i + 1];
            if(!!sell && !!buy) {
                resRub.push([Date.parse(sell.created_on), buy.price_rub_formatted, sell.price_rub_formatted]);
                resUsd.push([Date.parse(sell.created_on), buy.price_usd_formatted, sell.price_usd_formatted]);
                resEur.push([Date.parse(sell.created_on), buy.price_eur_formatted, sell.price_eur_formatted]);
            }
        }
        return {
            rub: resRub,
            usd: resUsd,
            eur: resEur
        };
    }

    function renderChart (currency, hours) {
        var actualUrl = tickerHistoryUrl;
        if (hours) {
            actualUrl = actualUrl + '?hours=' + hours;
        }
         $.get(actualUrl, function(resdata) {
            chartDataRaw = resdata;
            var data = responseToChart(resdata)[currency];
          $('#container-graph').highcharts({

                chart: {
                    type: 'arearange',
                    zoomType: 'x',
                  backgroundColor: {
                     linearGradient: { x1: 0, y1: 0, x2: 1, y2: 1 },
                     stops: [
                        [0, '#e3ffda'],
                        [1, '#e3ffda']
                     ]
                  },
                    events : {
                        load : function () {
                            // set up the updating of the chart each second
                            var series = this.series[0];
                            setInterval(function () {
                                $.get(tickerLatestUrl, function (resdata) {
                                    var lastdata = responseToChart(resdata)[currency];
                                    if ( chartDataRaw.length && parseInt(resdata[0].unix_time) >
                                         parseInt(chartDataRaw[chartDataRaw.length - 1].unix_time)
                                    ) {
                                        //Only update if a ticker 'tick' had occured
                                        series.addPoint(lastdata[0], true, true);
                                        Array.prototype.push.apply(chartDataRaw, resdata);
                                    }

                                });
                        }, 1000 * 30);
                      }
                    }
                },

                title: {
                    text: 'BTC/' + currency.toUpperCase()
                },

                xAxis: {
                    type: 'datetime',
                    dateTimeLabelFormats: {
                       day: '%e %b',
                        hour: '%H %M'

                    }
                },
                yAxis: {
                    title: {
                        text: null
                    }
                },

                tooltip: {
                    crosshairs: true,
                    shared: true,
                    valueSuffix: ' ' + currency.toLocaleUpperCase()
                },

                legend: {
                    enabled: false
                },

                series: [{
                    name: currency === 'rub' ? '????????' : 'Price',
                    data: data,
                    color: 'lightgreen',
                    // TODO: fix this! make dynamic
                    pointInterval: 3600 * 1000
                }]
            });
        });
    }

    /*module.exports = {
        responseToChart:responseToChart,
        renderChart: renderChart,
        apiRoot: apiRoot,
        chartDataRaw: chartDataRaw,
        tickerHistoryUrl: tickerHistoryUrl,
        tickerLatestUrl: tickerLatestUrl
    };*/

}); //jshint ignore:line
