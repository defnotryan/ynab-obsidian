const YearMonthKey = require('./YearMonthKey');

const REGISTRY_SOURCE = '#investment-account-meta and -"meta/templates"';
const SNAPSHOT_SOURCE = '#investment-snapshot and -"meta/templates"';
const CLASSIFICATIONS = ['investment-retirement', 'investment-brokerage'];
const STATUSES = ['active', 'closed'];

const text = (value) => value == null ? '' : String(value).trim();

const dateKey = (value) => {
    if (!value) return '';
    if (typeof value.toFormat === 'function') return value.toFormat('yyyy-MM-dd');
    return text(value).slice(0, 10);
};

const monthKey = (value) => dateKey(value).slice(0, 7);

const pageTags = (page) => {
    const tags = page.file?.tags;
    const values = tags?.array ? tags.array() : (tags ?? []);
    return values.map(tag => text(tag).replace(/^#/, ''));
};

const snapshotPages = (dv) => dv.pages(SNAPSHOT_SOURCE).array();

const readRegistry = (dv) => {
    const pages = dv.pages(REGISTRY_SOURCE).array();
    const records = pages.map(page => ({
        page,
        accountId: text(page.account_id),
        displayName: text(page.display_name) || text(page.account_id),
        institution: text(page.institution),
        classification: text(page.classification),
        status: text(page.status),
        snapshotFolder: text(page.snapshot_folder),
        snapshotCadence: text(page.snapshot_cadence),
        closedDate: dateKey(page.closed_date),
        closureDisposition: text(page.closure_disposition),
        includeInNetWorth: page.include_in_net_worth !== false,
        includeInFiAssets: page.include_in_fi_assets !== false
    }));

    const errors = [];
    const byId = new Map();

    if (records.length === 0) {
        errors.push('No investment account registry notes found.');
    }

    for (const record of records) {
        if (!record.accountId) {
            errors.push(`Registry note ${record.page.file.path} has no account_id.`);
            continue;
        }
        if (byId.has(record.accountId)) {
            errors.push(`Duplicate registry account_id: ${record.accountId}.`);
        }
        byId.set(record.accountId, record);

        if (!CLASSIFICATIONS.includes(record.classification)) {
            errors.push(`${record.accountId} has invalid classification: ${record.classification || '(missing)'}.`);
        }
        if (!STATUSES.includes(record.status)) {
            errors.push(`${record.accountId} has invalid status: ${record.status || '(missing)'}.`);
        }
        if (!record.snapshotFolder) {
            errors.push(`${record.accountId} has no snapshot_folder.`);
        }
        if (record.status === 'closed' && !record.closedDate) {
            errors.push(`${record.accountId} is closed but has no closed_date.`);
        }
    }

    if (errors.length > 0) {
        throw new Error(`Investment account registry errors:\n- ${errors.join('\n- ')}`);
    }

    const snapshots = snapshotPages(dv);
    const unregisteredSnapshots = snapshots.filter(page => !byId.has(text(page.investment_account)));

    return { records, byId, snapshots, unregisteredSnapshots };
};

const latestSnapshotFor = (data, accountId, yearMonthKey) => {
    let candidates = data.snapshots.filter(page =>
        text(page.investment_account) === accountId && page.date
    );

    if (yearMonthKey) {
        candidates = candidates.filter(page =>
            YearMonthKey.isIsoStringNoLaterThanEndOfMonth(page.date, yearMonthKey)
        );
    }

    return candidates.sort((a, b) => {
        const dateComparison = dateKey(b.date).localeCompare(dateKey(a.date));
        if (dateComparison !== 0) return dateComparison;
        return text(a.file.path).localeCompare(text(b.file.path));
    })[0];
};

const accountIdsForClassification = (dv, classification) => {
    const data = readRegistry(dv);
    return dv.array(data.records
        .filter(record => record.classification === classification)
        .map(record => record.accountId));
};

const listRetirementInvestmentAccounts = (dv) =>
    accountIdsForClassification(dv, 'investment-retirement');

const listBrokerageInvestmentAccounts = (dv) =>
    accountIdsForClassification(dv, 'investment-brokerage');

const latestValueForInvestmentAccount = (dv, account) => {
    const data = readRegistry(dv);
    return latestSnapshotFor(data, account)?.value;
};

const latestValueForInvestmentAccountAsOfYearMonth = (dv, account, yearMonthKey) => {
    const data = readRegistry(dv);
    return latestSnapshotFor(data, account, yearMonthKey)?.value;
};

const sumLatestValuesForClassification = (dv, classification, yearMonthKey) => {
    const data = readRegistry(dv);
    const registryErrors = data.unregisteredSnapshots.map(page =>
        `Snapshot ${page.file.path} references unregistered account ${text(page.investment_account) || '(missing)'}.`
    );

    if (registryErrors.length > 0) {
        throw new Error(`Investment account registry mismatch:\n- ${registryErrors.join('\n- ')}`);
    }

    const missingSnapshots = [];
    const total = data.records
        .filter(record => record.classification === classification && record.includeInNetWorth)
        .map(record => {
            const snapshot = latestSnapshotFor(data, record.accountId, yearMonthKey);
            if (!snapshot) {
                missingSnapshots.push(record.accountId);
                return 0;
            }
            return Number(snapshot.value ?? 0);
        })
        .reduce((sum, value) => sum + value, 0);

    if (missingSnapshots.length > 0) {
        const period = yearMonthKey ? ` as of ${yearMonthKey}` : '';
        throw new Error(`No investment snapshot found for ${missingSnapshots.join(', ')}${period}.`);
    }

    return total;
};

const sumLatestValuesForRetirementAccounts = (dv) =>
    sumLatestValuesForClassification(dv, 'investment-retirement');

const sumLatestValuesForRetirementAccountsAsOfYearMonth = (dv, yearMonthKey) =>
    sumLatestValuesForClassification(dv, 'investment-retirement', yearMonthKey);

const sumLatestValuesForBrokerageAccounts = (dv) =>
    sumLatestValuesForClassification(dv, 'investment-brokerage');

const sumLatestValuesForBrokerageAccountsAsOfYearMonth = (dv, yearMonthKey) =>
    sumLatestValuesForClassification(dv, 'investment-brokerage', yearMonthKey);

const snapshotCoverageForMonth = (dv, referenceYearMonth) => {
    const data = readRegistry(dv);
    const referenceEnd = YearMonthKey.toDate(referenceYearMonth).endOf('month');
    const referenceEndKey = referenceEnd.toFormat('yyyy-MM-dd');
    const registryIssues = data.unregisteredSnapshots.map(page =>
        `Unregistered snapshot: ${page.file.path}`
    );

    const rows = data.records.map(record => {
        const accountSnapshots = data.snapshots.filter(page =>
            text(page.investment_account) === record.accountId
        );
        const latestSnapshot = latestSnapshotFor(data, record.accountId);
        const latestAsOfSnapshot = latestSnapshotFor(data, record.accountId, referenceYearMonth);
        const issues = [];

        for (const snapshot of accountSnapshots) {
            const tags = pageTags(snapshot);
            const classificationTags = CLASSIFICATIONS.filter(classification => tags.includes(classification));
            if (classificationTags.length !== 1) {
                issues.push(`${snapshot.file.name}: expected exactly one classification tag`);
            } else if (classificationTags[0] !== record.classification) {
                issues.push(`${snapshot.file.name}: classification tag does not match registry`);
            }

            if (record.snapshotFolder && !text(snapshot.file.path).startsWith(`${record.snapshotFolder}/`)) {
                issues.push(`${snapshot.file.name}: snapshot is outside registered folder`);
            }

            if (record.status === 'closed' && record.closedDate && dateKey(snapshot.date) > record.closedDate) {
                issues.push(`${snapshot.file.name}: snapshot is after closure date`);
            }
        }

        let status;
        let coverageSnapshot = latestAsOfSnapshot;
        if (record.status === 'closed') {
            status = 'Closed';
            if (!latestSnapshot) {
                issues.push('closed account has no final snapshot');
            } else if (record.closedDate && dateKey(latestSnapshot.date) !== record.closedDate) {
                issues.push(`latest snapshot is not on closure date ${record.closedDate}`);
            } else if (Number(latestSnapshot.value ?? 0) !== 0) {
                issues.push('final snapshot is not zero balance');
            }
            coverageSnapshot = latestSnapshot;
        } else if (!latestAsOfSnapshot) {
            status = 'Missing';
            issues.push(`no snapshot through ${referenceYearMonth}`);
        } else if (monthKey(latestAsOfSnapshot.date) === referenceYearMonth) {
            status = 'Current';
        } else {
            status = 'Stale';
        }

        if (latestSnapshot && dateKey(latestSnapshot.date) > referenceEndKey) {
            issues.push(`latest snapshot is after reference month ${referenceYearMonth}`);
        }

        const latestMonth = coverageSnapshot ? monthKey(coverageSnapshot.date) : '';
        const ageMonths = latestMonth && status === 'Stale'
            ? Math.round(YearMonthKey.toDate(referenceYearMonth)
                .diff(YearMonthKey.toDate(latestMonth), 'months').months)
            : 0;

        return {
            accountId: record.accountId,
            displayName: record.displayName,
            institution: record.institution,
            classification: record.classification,
            lifecycleStatus: record.status,
            status,
            expectedThrough: record.status === 'active' ? referenceYearMonth : '',
            latestSnapshot: latestSnapshot?.file.link,
            latestSnapshotDate: latestSnapshot ? dateKey(latestSnapshot.date) : '',
            latestValue: latestSnapshot?.value,
            coverageSnapshotDate: coverageSnapshot ? dateKey(coverageSnapshot.date) : '',
            ageMonths,
            snapshotCount: accountSnapshots.length,
            issues: issues.join('; '),
            registryPage: record.page.file.link
        };
    });

    return { referenceYearMonth, rows, registryIssues };
};

const fiAssetSnapshotCoverageForMonth = (dv, referenceYearMonth) => {
    const data = readRegistry(dv);
    const registryIssues = data.unregisteredSnapshots.map(page =>
        `Unregistered snapshot: ${page.file.path}`
    );

    const rows = data.records
        .filter(record => record.includeInFiAssets)
        .map(record => {
            const latestSnapshot = latestSnapshotFor(data, record.accountId, referenceYearMonth);
            const isAfterClosure = record.status === 'closed'
                && record.closedDate
                && referenceYearMonth > record.closedDate.slice(0, 7);
            const issues = [];
            const accountSnapshots = data.snapshots.filter(page =>
                text(page.investment_account) === record.accountId
            );

            for (const snapshot of accountSnapshots) {
                const tags = pageTags(snapshot);
                const classificationTags = CLASSIFICATIONS.filter(classification => tags.includes(classification));
                if (classificationTags.length !== 1) {
                    issues.push(`${snapshot.file.name}: expected exactly one classification tag`);
                } else if (classificationTags[0] !== record.classification) {
                    issues.push(`${snapshot.file.name}: classification tag does not match registry`);
                }

                if (record.snapshotFolder && !text(snapshot.file.path).startsWith(`${record.snapshotFolder}/`)) {
                    issues.push(`${snapshot.file.name}: snapshot is outside registered folder`);
                }

                if (record.status === 'closed' && record.closedDate && dateKey(snapshot.date) > record.closedDate) {
                    issues.push(`${snapshot.file.name}: snapshot is after closure date`);
                }
            }

            if (isAfterClosure) {
                const finalSnapshot = latestSnapshotFor(data, record.accountId);
                if (!finalSnapshot) {
                    issues.push('closed account has no final snapshot');
                } else if (record.closedDate && dateKey(finalSnapshot.date) !== record.closedDate) {
                    issues.push(`latest snapshot is not on closure date ${record.closedDate}`);
                } else if (Number(finalSnapshot.value ?? 0) !== 0) {
                    issues.push('final snapshot is not zero balance');
                }

                return {
                    accountId: record.accountId,
                    displayName: record.displayName,
                    classification: record.classification,
                    status: 'Closed',
                    value: 0,
                    snapshotDate: record.closedDate || '',
                    exactSnapshot: true,
                    issues
                };
            }

            if (!latestSnapshot) {
                issues.push(`no snapshot through ${referenceYearMonth}`);
                return {
                    accountId: record.accountId,
                    displayName: record.displayName,
                    classification: record.classification,
                    status: 'Missing',
                    value: null,
                    snapshotDate: '',
                    exactSnapshot: false,
                    issues
                };
            }

            const exactSnapshot = monthKey(latestSnapshot.date) === referenceYearMonth;
            if (!exactSnapshot) {
                issues.push(`latest snapshot is ${monthKey(latestSnapshot.date)}, not ${referenceYearMonth}`);
            }

            return {
                accountId: record.accountId,
                displayName: record.displayName,
                classification: record.classification,
                status: exactSnapshot ? 'Current' : 'Stale',
                value: Number(latestSnapshot.value ?? 0),
                snapshotDate: dateKey(latestSnapshot.date),
                exactSnapshot,
                issues
            };
        });

    const total = rows.reduce((sum, row) => sum + (row.value ?? 0), 0);
    const complete = registryIssues.length === 0
        && rows.every(row => row.exactSnapshot && row.issues.length === 0);

    return {
        referenceYearMonth,
        rows,
        total,
        complete,
        registryIssues
    };
};

module.exports = {
    listRetirementInvestmentAccounts,
    listBrokerageInvestmentAccounts,
    latestValueForInvestmentAccount,
    latestValueForInvestmentAccountAsOfYearMonth,
    sumLatestValuesForRetirementAccounts,
    sumLatestValuesForBrokerageAccounts,
    sumLatestValuesForRetirementAccountsAsOfYearMonth,
    sumLatestValuesForBrokerageAccountsAsOfYearMonth,
    snapshotCoverageForMonth,
    fiAssetSnapshotCoverageForMonth
};
