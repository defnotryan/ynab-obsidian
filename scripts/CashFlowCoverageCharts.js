const dollarComparisonChart = (series) => ({
    type: 'line',
    data: {
        labels: series.map(summary => summary.endYearMonth),
        datasets: [
            {
                label: 'Passive investment growth',
                data: series.map(summary => summary.passiveGrowth),
                borderColor: '#27AE60'
            },
            {
                label: 'Active savings',
                data: series.map(summary => summary.activeSavings),
                borderColor: '#2E86C1'
            },
            {
                label: 'Active labor income',
                data: series.map(summary => summary.activeLaborIncome),
                borderColor: '#E67E22'
            }
        ]
    }
});

const ratioChart = (series) => ({
    type: 'line',
    data: {
        labels: series.map(summary => summary.endYearMonth),
        datasets: [
            {
                label: 'Growth / active savings',
                data: series.map(summary => summary.growthToSavings),
                borderColor: '#2E86C1'
            },
            {
                label: 'Growth / active labor income',
                data: series.map(summary => summary.growthToActiveIncome),
                borderColor: '#E67E22'
            },
            {
                label: 'Crossover',
                data: series.map(() => 1),
                borderColor: '#777777',
                borderDash: [5, 5],
                pointRadius: 0
            }
        ]
    }
});

module.exports = {
    dollarComparisonChart,
    ratioChart
};
