
const { DateTime } = require('luxon');

const fromDate = (d) => d.toFormat("yyyy-MM");

const fromIsoTimestamp = (isoString) => {
    const dt = DateTime.fromISO(isoString);
    return fromDate(dt);
}

const toDate = (k) => DateTime.fromFormat(k, "yyyy-MM");

const monthOf = (k) => k.match(/\d{4}-(\d{2})/)[1];

const yearOf = (k) => k.match(/(\d{4})-\d{2}/)[1];

const monthTagFor = (k) => `#month-${monthOf(k)}`;

const yearTagFor = (k) => `#year-${yearOf(k)}`;

const toDisplayString = (k, dv) => dv.date(k).toFormat("MMM yyyy");

const isSameMonth = (thisDate, thatDate) => thisDate.hasSame(thatDate, 'month') && thisDate.hasSame(thatDate, 'year');

const isTimestampWithinMonth = (timestamp, yearMonthKey) => {
    const dt = DateTime.fromISO(timestamp);
    const ymDate = toDate(yearMonthKey);
    return dt.hasSame(ymDate, 'month') && dt.hasSame(ymDate, 'year');
}

const isIsoStringNoLaterThanEndOfMonth = (isoString, yearMonthKey) => {
    const dt = DateTime.fromISO(isoString);
    const ymDate = DateTime.fromISO(yearMonthKey).endOf('month');
    return dt <= ymDate;
}

const generatePreviousMonths = (k, n) => {
    const result = [];
    const baseDate = toDate(k);
    for (let i = 1; i < n + 1; i++) {
        const dt = baseDate.minus({ months: i });
        result.push(fromDate(dt));
    }
    return result;
}

const generateWindows = (keys, windowSize) => keys.slice(windowSize).map(k => generatePreviousMonths(k, windowSize));

module.exports = {
    fromDate,
    fromIsoTimestamp,
    toDate,
    monthOf,
    yearOf,
    monthTagFor,
    yearTagFor,
    toDisplayString,
    isSameMonth,
    isTimestampWithinMonth,
    isIsoStringNoLaterThanEndOfMonth,
    generatePreviousMonths,
    generateWindows
};