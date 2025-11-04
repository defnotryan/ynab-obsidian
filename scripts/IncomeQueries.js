const YearMonthKey = require('./YearMonthKey');

const totalGrossIncomeForYearMonth = (dv, ymk) => 
    dv.pages('"Income" and #income')
        .filter(p => YearMonthKey.isSameMonth(dv.date(ymk), p.received_date))
        .map(p => p.income_gross)
        .sum();

module.exports = {
    totalGrossIncomeForYearMonth
}