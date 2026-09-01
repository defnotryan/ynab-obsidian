const YearMonthKey = require('./YearMonthKey');
const IncomeQueries = require('./IncomeQueries');
const InvestmentAccountQueries = require('./InvestmentAccountQueries');
const SavingsRateQueries = require('./SavingsRateQueries');

const DEFAULT_EMPLOYER_MATCH_RATE = 0.06;
const DEFAULT_PERSISTENCE_WINDOWS = 3;

const priorMonth = (yearMonthKey) =>
    YearMonthKey.toDate(yearMonthKey).minus({ months: 1 }).toFormat('yyyy-MM');

const monthsEndingAt = (endYearMonth, numberOfMonths) => {
    const endDate = YearMonthKey.toDate(endYearMonth);
    return Array.from({ length: numberOfMonths }, (_, index) =>
        endDate.minus({ months: numberOfMonths - index - 1 }).toFormat('yyyy-MM')
    );
};

const sumField = (rows, field) =>
    rows.reduce((sum, row) => sum + Number(row[field] ?? 0), 0);

const ratio = (numerator, denominator) =>
    numerator == null || !denominator ? null : numerator / denominator;

const monthlyCoverageForYearMonth = (dv, yearMonthKey, employerMatchRate = DEFAULT_EMPLOYER_MATCH_RATE) => {
    const beginningYearMonth = priorMonth(yearMonthKey);
    const beginningCoverage = InvestmentAccountQueries.fiAssetSnapshotCoverageForMonth(dv, beginningYearMonth);
    const endingCoverage = InvestmentAccountQueries.fiAssetSnapshotCoverageForMonth(dv, yearMonthKey);
    const savings = SavingsRateQueries.activeSavingsComponentsForYearMonth(dv, yearMonthKey);
    const activeLaborIncome = IncomeQueries.totalActiveLaborIncomeForYearMonth(dv, yearMonthKey);
    const recurringActiveLaborIncome = IncomeQueries.totalActiveLaborIncomeForYearMonth(dv, yearMonthKey, false);
    const nonLaborIncome = IncomeQueries.totalNonLaborIncomeForYearMonth(dv, yearMonthKey);
    const employerMatch = activeLaborIncome * employerMatchRate;
    const snapshotComplete = beginningCoverage.complete && endingCoverage.complete;
    const beginningInvestmentValue = snapshotComplete ? beginningCoverage.total : null;
    const endingInvestmentValue = snapshotComplete ? endingCoverage.total : null;
    const passiveGrowth = snapshotComplete
        ? endingInvestmentValue - beginningInvestmentValue - savings.total - employerMatch
        : null;

    const issues = [
        ...beginningCoverage.registryIssues,
        ...endingCoverage.registryIssues,
        ...beginningCoverage.rows.flatMap(row => row.issues),
        ...endingCoverage.rows.flatMap(row => row.issues)
    ].filter((issue, index, all) => all.indexOf(issue) === index);

    return {
        yearMonthKey,
        beginningYearMonth,
        beginningInvestmentValue,
        endingInvestmentValue,
        total401k: savings.total401k,
        totalHsa: savings.totalHsa,
        totalSaveSpending: savings.totalSaveSpending,
        activeSavings: savings.total,
        employerMatchRate,
        employerMatch,
        totalActiveContributions: savings.total + employerMatch,
        activeLaborIncome,
        recurringActiveLaborIncome,
        nonLaborIncome,
        passiveGrowth,
        snapshotComplete,
        issues,
        beginningCoverage,
        endingCoverage
    };
};

const summaryForYearMonth = (dv, endYearMonth, numberOfMonths = 12, employerMatchRate = DEFAULT_EMPLOYER_MATCH_RATE) => {
    const months = monthsEndingAt(endYearMonth, numberOfMonths);
    const rows = months.map(month => monthlyCoverageForYearMonth(dv, month, employerMatchRate));
    const growthRows = rows.filter(row => row.passiveGrowth != null);
    const complete = growthRows.length === rows.length;
    const issues = rows.flatMap(row => row.issues)
        .filter((issue, index, all) => all.indexOf(issue) === index);
    const passiveGrowth = complete ? sumField(rows, 'passiveGrowth') : null;
    const activeSavings = sumField(rows, 'activeSavings');
    const totalActiveContributions = sumField(rows, 'totalActiveContributions');
    const activeLaborIncome = sumField(rows, 'activeLaborIncome');
    const recurringActiveLaborIncome = sumField(rows, 'recurringActiveLaborIncome');
    const nonLaborIncome = sumField(rows, 'nonLaborIncome');

    return {
        endYearMonth,
        numberOfMonths,
        rows,
        complete,
        historyMonthsAvailable: growthRows.length,
        expectedHistoryMonths: rows.length,
        status: complete ? 'Complete' : `Insufficient investment history (${growthRows.length}/${rows.length} months)`,
        issues,
        passiveGrowth,
        activeSavings,
        totalActiveContributions,
        employerMatch: sumField(rows, 'employerMatch'),
        activeLaborIncome,
        recurringActiveLaborIncome,
        nonLaborIncome,
        growthToSavings: ratio(passiveGrowth, activeSavings),
        growthToTotalActiveContributions: ratio(passiveGrowth, totalActiveContributions),
        growthToActiveIncome: ratio(passiveGrowth, activeLaborIncome),
        growthToRecurringActiveIncome: ratio(passiveGrowth, recurringActiveLaborIncome),
        savingsMilestone: complete && passiveGrowth > activeSavings,
        totalContributionsMilestone: complete && passiveGrowth > totalActiveContributions,
        activeIncomeMilestone: complete && passiveGrowth > activeLaborIncome,
        recurringActiveIncomeMilestone: complete && passiveGrowth > recurringActiveLaborIncome
    };
};

const persistenceForSeries = (series, milestoneField, endYearMonth, requiredWindows = DEFAULT_PERSISTENCE_WINDOWS) => {
    const latest = series[series.length - 1];
    if (!latest || latest.endYearMonth !== endYearMonth) {
        return {
            achieved: false,
            currentWindowComplete: false,
            consecutiveWindows: 0,
            requiredWindows,
            latestCompleteWindow: latest?.endYearMonth ?? null
        };
    }

    let consecutiveWindows = 0;
    for (let index = series.length - 1; index >= 0; index -= 1) {
        const summary = series[index];
        if (!summary[milestoneField]) break;
        if (index < series.length - 1
            && priorMonth(series[index + 1].endYearMonth) !== summary.endYearMonth) {
            break;
        }
        consecutiveWindows += 1;
    }

    return {
        achieved: consecutiveWindows >= requiredWindows,
        currentWindowComplete: true,
        consecutiveWindows,
        requiredWindows,
        latestCompleteWindow: latest.endYearMonth
    };
};

const seriesForWindow = (dv, numberOfMonths, endYearMonth, employerMatchRate = DEFAULT_EMPLOYER_MATCH_RATE) => {
    const snapshotMonths = dv.pages('#investment-snapshot and -"meta/templates"')
        .map(page => page.date)
        .map(date => date?.toFormat ? date.toFormat('yyyy-MM') : String(date).slice(0, 7))
        .distinct()
        .sort(month => month)
        .array()
        .filter(month => !endYearMonth || month <= endYearMonth);

    return snapshotMonths
        .map(month => summaryForYearMonth(dv, month, numberOfMonths, employerMatchRate))
        .filter(summary => summary.complete);
};

module.exports = {
    DEFAULT_EMPLOYER_MATCH_RATE,
    DEFAULT_PERSISTENCE_WINDOWS,
    priorMonth,
    monthsEndingAt,
    monthlyCoverageForYearMonth,
    summaryForYearMonth,
    persistenceForSeries,
    seriesForWindow
};
