const YearMonthKey = require('./YearMonthKey');

const isSameYearMonth = (dv, ymk, page) =>
    YearMonthKey.isSameMonth(dv.date(ymk), page.received_date);

const pageHasTag = (page, tag) => {
    const tags = page.file?.tags;
    const values = tags?.array ? tags.array() : (tags ?? []);
    return values.some(value => String(value).replace(/^#/, '') === tag);
};

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

const totalActiveLaborIncomeForYearMonth = (dv, ymk, includeBonuses = true) =>
    dv.pages('"Income" and #income and #payslip')
        .filter(p => isSameYearMonth(dv, ymk, p))
        .filter(p => includeBonuses || !pageHasTag(p, 'sas_bonus'))
        .map(p => p.income_gross)
        .sum();

const totalActiveLaborIncomeForPreviousMonths = (dv, ymk, numberOfMonths, includeBonuses = true) => {
    const months = YearMonthKey.generatePreviousMonths(ymk, numberOfMonths);
    return dv.pages('"Income" and #income and #payslip')
        .filter(p => months.some(m => isSameYearMonth(dv, m, p)))
        .filter(p => includeBonuses || !pageHasTag(p, 'sas_bonus'))
        .map(p => p.income_gross)
        .sum();
};

const totalNonLaborIncomeForYearMonth = (dv, ymk) =>
    dv.pages('"Income" and #income')
        .filter(p => isSameYearMonth(dv, ymk, p))
        .filter(p => !pageHasTag(p, 'payslip'))
        .map(p => p.income_gross)
        .sum();

const totalNonLaborIncomeForPreviousMonths = (dv, ymk, numberOfMonths) => {
    const months = YearMonthKey.generatePreviousMonths(ymk, numberOfMonths);
    return dv.pages('"Income" and #income')
        .filter(p => months.some(m => isSameYearMonth(dv, m, p)))
        .filter(p => !pageHasTag(p, 'payslip'))
        .map(p => p.income_gross)
        .sum();
};

module.exports = {
    totalGrossIncomeForYearMonth,
    totalGrossIncomeForPreviousMonths,
    totalActiveLaborIncomeForYearMonth,
    totalActiveLaborIncomeForPreviousMonths,
    totalNonLaborIncomeForYearMonth,
    totalNonLaborIncomeForPreviousMonths
}
