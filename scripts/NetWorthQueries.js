const AccountQueries = require('./AccountQueries');
const RealEstateQueries = require('./RealEstateQueries');
const MortgageQueries = require('./MortgageQueries');
const InvestmentAccountQueries = require('./InvestmentAccountQueries');

const latestNetWorthWithRealEstate = (dv) => {
    const cashLikeTotal = AccountQueries.sumLatestClearedBalancesForAccounts(dv);
    const realEstateTotalAssets = RealEstateQueries.sumLatestValuesForProperties(dv);
    const mortgageTotalLiabilities = MortgageQueries.sumLatestBalanceForAccounts(dv);
    const retirementTotal = InvestmentAccountQueries.sumLatestValuesForRetirementAccounts(dv);
    const brokerageTotal = InvestmentAccountQueries.sumLatestValuesForBrokerageAccounts(dv);
    return cashLikeTotal + retirementTotal + brokerageTotal + (realEstateTotalAssets - mortgageTotalLiabilities);
}

const latestInvestableNetWorth = (dv) => {
    const cashLikeTotal = AccountQueries.sumLatestClearedBalancesForAccounts(dv);
    const retirementTotal = InvestmentAccountQueries.sumLatestValuesForRetirementAccounts(dv);
    const brokerageTotal = InvestmentAccountQueries.sumLatestValuesForBrokerageAccounts(dv);
    return cashLikeTotal + retirementTotal + brokerageTotal;
}

const netWorthWithRealEstateAsOfYearMonth = (dv, yearMonthKey) => {
    const cashLikeTotal = AccountQueries.sumLatestClearedBalancesForAccountsAsOfYearMonth(dv, yearMonthKey);
    const realEstateTotalAssets = RealEstateQueries.sumLatestValuesForPropertiesAsOfYearMonth(dv, yearMonthKey);
    const mortgageTotalLiabilities = MortgageQueries.sumLatestBalanceForAccountsAsOfYearMonth(dv, yearMonthKey);
    const retirementTotal = InvestmentAccountQueries.sumLatestValuesForRetirementAccountsAsOfYearMonth(dv, yearMonthKey);
    const brokerageTotal = InvestmentAccountQueries.sumLatestValuesForBrokerageAccountsAsOfYearMonth(dv, yearMonthKey);
    return cashLikeTotal + retirementTotal + brokerageTotal + (realEstateTotalAssets - mortgageTotalLiabilities);
}

const netWorthWithInvestmentRealEstateAsOfYearMonth = (dv, yearMonthKey) => {
    const cashLikeTotal = AccountQueries.sumLatestClearedBalancesForAccountsAsOfYearMonth(dv, yearMonthKey);
    const realEstateTotalAssets = RealEstateQueries.sumLatestValuesForInvestmentPropertiesAsOfYearMonth(dv, yearMonthKey);
    const retirementTotal = InvestmentAccountQueries.sumLatestValuesForRetirementAccountsAsOfYearMonth(dv, yearMonthKey);
    const brokerageTotal = InvestmentAccountQueries.sumLatestValuesForBrokerageAccountsAsOfYearMonth(dv, yearMonthKey);
    return cashLikeTotal + retirementTotal + brokerageTotal + realEstateTotalAssets;
}

const investableNetWorthAsOfYearMonth = (dv, yearMonthKey) => {
    const cashLikeTotal = AccountQueries.sumLatestClearedBalancesForAccountsAsOfYearMonth(dv, yearMonthKey);
    const retirementTotal = InvestmentAccountQueries.sumLatestValuesForRetirementAccountsAsOfYearMonth(dv, yearMonthKey);
    const brokerageTotal = InvestmentAccountQueries.sumLatestValuesForBrokerageAccountsAsOfYearMonth(dv, yearMonthKey);
    return cashLikeTotal + retirementTotal + brokerageTotal;
}

module.exports = {
    latestNetWorthWithRealEstate,
    latestInvestableNetWorth,
    netWorthWithRealEstateAsOfYearMonth,
    netWorthWithInvestmentRealEstateAsOfYearMonth,
    investableNetWorthAsOfYearMonth
}