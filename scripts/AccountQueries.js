
const YearMonthKey = require('./YearMonthKey');

const listAccounts =  (dv) =>
    dv.pages('#ynab_account_snapshot and -"meta/templates"')
        .map(a => a.account_name)
        .distinct();

const latestClearedBalanceForAccount = (dv, account) =>
    dv.pages('#ynab_account_snapshot and -"meta/templates"')
        .where(s => s.account_name === account)
        .sort(s => s.timestamp, "desc")
        .limit(1)
        .map(s => s.cleared_balance)
        .first();

const latestClearedBalanceForAccountAsOfYearMonth = (dv, account, yearMonthKey) =>
    dv.pages('#ynab_account_snapshot and -"meta/templates"')
        .where(s => s.account_name === account)
        .where(s => YearMonthKey.isIsoStringNoLaterThanEndOfMonth(s.timestamp, yearMonthKey))
        .sort(s => s.timestamp, "desc")
        .limit(1)
        .map(s => s.cleared_balance)
        .first();

const sumLatestClearedBalancesForAccounts = (dv) =>
    dv.pages('#ynab_account_snapshot and -"meta/templates"')
        .groupBy(s => s.account_name)
        .map(group => group.rows
            .sort(s => s.timestamp, "desc")
            .limit(1)
            .map(s => s.cleared_balance)
            .first()
        )
        .sum();

const sumLatestClearedBalancesForAccountsAsOfYearMonth = (dv, yearMonthKey) =>
    dv.pages('#ynab_account_snapshot and -"meta/templates"')
        .where(s => YearMonthKey.isIsoStringNoLaterThanEndOfMonth(s.timestamp, yearMonthKey))
        .groupBy(s => s.account_name)
        .map(group => group.rows
            .sort(s => s.timestamp, "desc")
            .limit(1)
            .map(s => s.cleared_balance)
            .first()
        )
        .sum();

module.exports = {
    listAccounts,
    latestClearedBalanceForAccount,
    sumLatestClearedBalancesForAccounts,
    latestClearedBalanceForAccountAsOfYearMonth,
    sumLatestClearedBalancesForAccountsAsOfYearMonth
};