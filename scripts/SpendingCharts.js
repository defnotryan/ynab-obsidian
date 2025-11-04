const YearMonthKey = require('./YearMonthKey');
const SpendingQueries = require('./SpendingQueries');

const windowChartForCategory = (dv, windowSize, category) => {
    const ymks = SpendingQueries.yearMonthKeys(dv);
    const labels = ymks.slice(windowSize).map(k => YearMonthKey.toDisplayString(k, dv))
    const windows = YearMonthKey.generateWindows(ymks, windowSize)
    const dataSeries = windows.map(window => {
	    return SpendingQueries.txnsInYearMonthSetAndCategory(dv, window, category)
		    .map(t => -t.amount)
		    .sum();
        });
    return {
	    type: "line",
	    data: {
		    labels: labels.array(),
		    datasets: [{
			    label: "Spending",
			    data: dataSeries.array()
		    }]
	    }
    }
}

module.exports = {
    windowChartForCategory
}