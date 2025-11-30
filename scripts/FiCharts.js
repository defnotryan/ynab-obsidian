const _ = require("lodash");

const simpleProjectionChart = (startingNetWorth, netWorthGrowth, startingFiNumber, fiNumberGrowth, numberOfYears) => {
    const years = _.range(0, numberOfYears);
    const netWorthData = years.map(year => startingNetWorth * Math.pow((1 + netWorthGrowth), year));
    const fiNumberData = years.map(year => startingFiNumber * Math.pow((1 + fiNumberGrowth), year));
    const yearLabels = years.map(year => `T+${year}Y`);
    return {
        type: "line",
        data: {
            labels: yearLabels,
            datasets: [
                {
                    label: "Net Worth",
                    data: netWorthData,
                    borderColor: '#27AE60'
                }, {
                    label: "FI Number",
                    data: fiNumberData,
                    borderColor: '#e65d22ff'
                }
            ]
        }
    }
}

const projectionChartWithIncome = (startingNetWorth, netWorthGrowth, startingFiNumber, fiNumberGrowth, annualIncome, savingsRate, incomeGrowth, numberOfYears) => {
    const years = _.range(0, numberOfYears);
    const yearLabels = years.map(year => `T+${year}Y`);
    
    let netWorthData = [];
    let fiNumberData = [];
    for (let i = 0; i < numberOfYears; i++) {
        const currentIncome = annualIncome * Math.pow((1 + incomeGrowth), i);
        const savedIncome = currentIncome * savingsRate;
        const previousNetWorth = i === 0 ? startingNetWorth : netWorthData[i - 1];
        const newNetWorth = (previousNetWorth + savedIncome) * (1 + netWorthGrowth);
        netWorthData.push(newNetWorth);

        const previousFiNumber = i === 0 ? startingFiNumber : fiNumberData[i - 1];
        const newFiNumber = previousFiNumber * (1 + fiNumberGrowth);
        fiNumberData.push(newFiNumber);
    }

    return {
        type: "line",
        data: {
            labels: yearLabels,
            datasets: [
                {
                    label: "Net Worth",
                    data: netWorthData,
                    borderColor: '#27AE60'
                }, {
                    label: "FI Number",
                    data: fiNumberData,
                    borderColor: '#e65d22ff'
                }
            ]
        }
    }
}

module.exports = {
    simpleProjectionChart,
    projectionChartWithIncome
}