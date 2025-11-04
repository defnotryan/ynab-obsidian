const YearMonthKey = require('./YearMonthKey');

const listAccounts = (dv) =>
    dv.pages('#mortgage-statement and -"meta/templates"')
        .map(s => s.mortgage_account)
        .distinct();

const latestBalanceForAccount = (dv, account) =>
    dv.pages('#mortgage-statement and -"meta/templates"')
        .where(s => s.mortgage_account === account)
        .sort(s => s.date, "desc")
        .limit(1)
        .map(s => s.principal_balance)
        .first();

const latestBalanceForAccountAsOfYearMonth = (dv, account, yearMonthKey) =>
    dv.pages('#mortgage-statement and -"meta/templates"')
        .where(s => s.mortgage_account === account)
        .where(s => YearMonthKey.isIsoStringNoLaterThanEndOfMonth(s.date, yearMonthKey))
        .sort(s => s.date, "desc")
        .limit(1)
        .map(s => s.principal_balance)
        .first();

const sumLatestBalanceForAccounts = (dv) =>
    dv.pages('#mortgage-statement and -"meta/templates"')
        .groupBy(s => s.mortgage_account)
        .map(group => group.rows
            .sort(s => s.date, "desc")
            .limit(1)
            .map(s => s.principal_balance)
            .first()
        )
        .sum();

const sumLatestBalanceForAccountsAsOfYearMonth = (dv, yearMonthKey) =>
    dv.pages('#mortgage-statement and -"meta/templates"')
        .where(s => YearMonthKey.isIsoStringNoLaterThanEndOfMonth(s.date, yearMonthKey))
        .groupBy(s => s.mortgage_account)
        .map(group => group.rows
            .sort(s => s.date, "desc")
            .limit(1)
            .map(s => s.principal_balance)
            .first()
        )
        .sum();

module.exports = {
    listAccounts,
    latestBalanceForAccount,
    sumLatestBalanceForAccounts,
    latestBalanceForAccountAsOfYearMonth,
    sumLatestBalanceForAccountsAsOfYearMonth
};