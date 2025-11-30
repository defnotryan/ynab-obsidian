const YearMonthKey = require('./YearMonthKey');

const totalGrossIncomeForYearMonth = (dv, ymk) => 
    dv.pages('"Income" and #income')
        .filter(p => YearMonthKey.isSameMonth(dv.date(ymk), p.received_date))
        .map(p => p.income_gross)
        .sum();

const totalGrossIncomeForPreviousMonths = (dv, ymk, numberOfMonths) => {
    const months = YearMonthKey.generatePreviousMonths(ymk, numberOfMonths);
    return dv.pages('"Income" and #income')
        .filter(p => months.some(m => YearMonthKey.isSameMonth(dv.date(m), p.received_date)))
        .map(p => p.income_gross)
        .sum();
}

module.exports = {
    totalGrossIncomeForYearMonth,
    totalGrossIncomeForPreviousMonths
}