const AccountQueries = require('./AccountQueries');
const RealEstateQueries = require('./RealEstateQueries');
const MortgageQueries = require('./MortgageQueries');
const InvestmentAccountQueries = require('./InvestmentAccountQueries');

const pieChartForNetWorth = (dv) => {
    const cashLikeTotal = AccountQueries.sumLatestClearedBalancesForAccounts(dv);
    const realEstateTotalAssets = RealEstateQueries.sumLatestValuesForProperties(dv);
    const mortgageTotalLiabilities = MortgageQueries.sumLatestBalanceForAccounts(dv);
    const retirementTotal = InvestmentAccountQueries.sumLatestValuesForRetirementAccounts(dv);
    const brokerageTotal = InvestmentAccountQueries.sumLatestValuesForBrokerageAccounts(dv);

    return {
        type: "pie",
        data: {
            labels: ["Cash & Cash Equivalents", "Retirement Investments", "Brokerage Investments", "Real Estate Equity"],
            datasets: [{
                data: [
                    cashLikeTotal,
                    retirementTotal,
                    brokerageTotal,
                    realEstateTotalAssets - mortgageTotalLiabilities
                ],
                backgroundColor: [
                    '#2E86C1', // Blue for cash
                    '#27AE60', // Green for retirement
                    '#F1C40F', // Yellow for brokerage
                    '#E67E22'  // Orange for real estate
                ]
            }]
        }
    };
};

module.exports = {
    pieChartForNetWorth
}