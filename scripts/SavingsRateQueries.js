const IncomeQueries = require("./IncomeQueries");
const PayslipQueries = require("./PayslipQueries");
const SpendingQueries = require("./SpendingQueries");

const activeSavingsComponentsForYearMonth = (dv, ymk) => {
    const total401k = PayslipQueries.total401kDeductionForYearMonth(dv, ymk);
    const totalHsa = PayslipQueries.totalHsaDeductionForYearMonth(dv, ymk);
    const totalSaveSpending = SpendingQueries.totalForYearMonthCategory(dv, ymk, "Save");
    return {
        total401k,
        totalHsa,
        totalSaveSpending,
        total: total401k + totalHsa + totalSaveSpending
    };
};

const activeSavingsForYearMonth = (dv, ymk) =>
    activeSavingsComponentsForYearMonth(dv, ymk).total;

const savingsRateForYearMonth = (dv, ymk) => {
    const grossIncome = IncomeQueries.totalGrossIncomeForYearMonth(dv, ymk);
    const savings = activeSavingsForYearMonth(dv, ymk);

    return grossIncome > 0 ? (savings / grossIncome) : 0;
}

module.exports = {
    savingsRateForYearMonth,
    activeSavingsComponentsForYearMonth,
    activeSavingsForYearMonth
}
