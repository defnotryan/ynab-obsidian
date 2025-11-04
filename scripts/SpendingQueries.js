const { _ } = require('lodash');
const { fromDate, yearTagFor, monthTagFor } = require('./YearMonthKey');

const spendingCategories = (dv) => 
    dv.pages("#ynab_transaction")
        .filter(p => !p.is_income)
        .map(p => p.category)
        .distinct()
        .sort(p => p);

const yearMonthKeys = (dv) =>
    dv.pages("#ynab_transaction")
        .map(p => p.date)
        .map(p => fromDate(p))
        .distinct()
        .sort(p => p);

const txnsByYearMonth = (dv, ymk) => {
    const yearTag = yearTagFor(ymk);
    const monthTag = monthTagFor(ymk);
    return dv.pages(`#ynab_transaction and ${yearTag} and ${monthTag}`);
}

const txnsInYearMonthSet = (dv, ymks) => {
    const txns = _.flatMap(ymks, ymk => txnsByYearMonth(dv, ymk).array());
    return dv.array(txns);
}
    

const txnsByYearMonthCategory = (dv, ymk, category) => {
    return txnsByYearMonth(dv, ymk).filter(p => p.category === category);
}

const txnsInYearMonthSetAndCategory = (dv, ymks, category) => txnsInYearMonthSet(dv, ymks).filter(p => p.category === category);

const totalForYearMonthCategory = (dv, ymk, category) => 
    txnsByYearMonthCategory(dv, ymk, category)
        .filter(t => !t.is_income)
        .map(t => -t.amount)
        .sum();

const totalForYearMonth = (dv, ymk) => 
    txnsByYearMonth(dv, ymk)
        .filter(t => !t.is_income)
        .map(t => -t.amount)
        .sum();

module.exports = {
    spendingCategories,
    yearMonthKeys,
    txnsByYearMonth,
    txnsByYearMonthCategory,
    txnsInYearMonthSet,
    txnsInYearMonthSetAndCategory,
    totalForYearMonthCategory,
    totalForYearMonth
};