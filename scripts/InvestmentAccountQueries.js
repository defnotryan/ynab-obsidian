const YearMonthKey = require('./YearMonthKey');

const listRetirementInvestmentAccounts = (dv) => 
    dv.pages('#investment-snapshot and #investment-retirement and -"meta/templates"')
	    .map(a => a.investment_account)
	    .distinct();

const listBrokerageInvestmentAccounts = (dv) => 
    dv.pages('#investment-snapshot and #investment-brokerage and -"meta/templates"')
	    .map(a => a.investment_account)
	    .distinct();

const latestValueForInvestmentAccount = (dv, account) =>
    dv.pages('#investment-snapshot and -"meta/templates"')
	    .where(p => p.investment_account === account)
	    .sort(p => p.date, "desc")
	    .limit(1)
	    .map(p => p.value)
	    .first()

const latestValueForInvestmentAccountAsOfYearMonth = (dv, account, yearMonthKey) =>
    dv.pages('#investment-snapshot and -"meta/templates"')
        .where(p => p.investment_account === account)
        .where(p => YearMonthKey.isIsoStringNoLaterThanEndOfMonth(p.date, yearMonthKey))
        .sort(p => p.date, "desc")
        .limit(1)
        .map(p => p.value)
        .first();

const sumLatestValuesForRetirementAccounts = (dv) =>
    dv.pages('#investment-snapshot and #investment-retirement and -"meta/templates"')
        .groupBy(p => p.investment_account)
        .map(group => group.rows
            .sort(p => p.date, "desc")
            .limit(1)
            .map(p => p.value)
            .first()
        )
        .sum();

const sumLatestValuesForRetirementAccountsAsOfYearMonth = (dv, yearMonthKey) =>
    dv.pages('#investment-snapshot and #investment-retirement and -"meta/templates"')
        .where(p => YearMonthKey.isIsoStringNoLaterThanEndOfMonth(p.date, yearMonthKey))
        .groupBy(p => p.investment_account)
        .map(group => group.rows
            .sort(p => p.date, "desc")
            .limit(1)
            .map(p => p.value)
            .first()
        )
        .sum();

const sumLatestValuesForBrokerageAccounts = (dv) =>
    dv.pages('#investment-snapshot and #investment-brokerage and -"meta/templates"')
        .groupBy(p => p.investment_account)
        .map(group => group.rows
            .sort(p => p.date, "desc")
            .limit(1)
            .map(p => p.value)
            .first()
        )
        .sum();


const sumLatestValuesForBrokerageAccountsAsOfYearMonth = (dv, yearMonthKey) =>
    dv.pages('#investment-snapshot and #investment-brokerage and -"meta/templates"')
        .where(p => YearMonthKey.isIsoStringNoLaterThanEndOfMonth(p.date, yearMonthKey))
        .groupBy(p => p.investment_account)
        .map(group => group.rows
            .sort(p => p.date, "desc")
            .limit(1)
            .map(p => p.value)
            .first()
        )
        .sum();

module.exports = {
    listRetirementInvestmentAccounts,
    listBrokerageInvestmentAccounts,
    latestValueForInvestmentAccount,
    sumLatestValuesForRetirementAccounts,
    sumLatestValuesForBrokerageAccounts,
    latestValueForInvestmentAccountAsOfYearMonth,
    sumLatestValuesForRetirementAccountsAsOfYearMonth,
    sumLatestValuesForBrokerageAccountsAsOfYearMonth
}