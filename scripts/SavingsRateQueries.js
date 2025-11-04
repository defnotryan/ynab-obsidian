const IncomeQueries = require("./IncomeQueries");
const PayslipQueries = require("./PayslipQueries");
const SpendingQueries = require("./SpendingQueries");

const savingsRateForYearMonth = (dv, ymk) => {
    const grossIncome = IncomeQueries.totalGrossIncomeForYearMonth(dv, ymk);
    const total401k = PayslipQueries.total401kDeductionForYearMonth(dv, ymk);
    const totalHsa = PayslipQueries.totalHsaDeductionForYearMonth(dv, ymk);
    const totalSaveSpending = SpendingQueries.totalForYearMonthCategory(dv, ymk, "Save");
    const savings = total401k + totalHsa + totalSaveSpending;

    return grossIncome > 0 ? (savings / grossIncome) : 0;
}

module.exports = {
    savingsRateForYearMonth
}
    