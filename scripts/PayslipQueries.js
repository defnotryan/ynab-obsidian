const YearMonthKey = require('./YearMonthKey');

const total401kDeductionForYearMonth = (dv, ymk) =>
    dv.pages('"Income" and #income and #payslip')
        .filter(p => YearMonthKey.isSameMonth(dv.date(ymk), p.received_date))
        .map(p => p.deducted_401k)
        .sum();

const totalHsaDeductionForYearMonth = (dv, ymk) =>
    dv.pages('"Income" and #income and #payslip')
        .filter(p => YearMonthKey.isSameMonth(dv.date(ymk), p.received_date))
        .map(p => p.deducted_hsa)
        .sum();

module.exports = {
    total401kDeductionForYearMonth,
    totalHsaDeductionForYearMonth
}
