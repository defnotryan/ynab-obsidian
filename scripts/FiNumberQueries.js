const SpendingQueries = require('./SpendingQueries');
const YearMonthKey = require('./YearMonthKey');

const fiMultiplier = 25;

const currentFiNumber = (dv, windowSize) => {
    const ymks = SpendingQueries.yearMonthKeys(dv);
    const recentYmks = YearMonthKey.generateWindows(ymks, windowSize).last();
    const totalSpendingForWindow = SpendingQueries.txnsInYearMonthSet(dv, recentYmks)
        .filter(t => !t.is_income)
            .map(t => -t.amount)
            .sum();
    const spendingPerMonth = totalSpendingForWindow / windowSize;
    const spendingPerYear = spendingPerMonth * 12;
    const fiNumber = spendingPerYear * fiMultiplier;
    return fiNumber;
}

module.exports = {
    currentFiNumber
}