const YearMonthKey = require('./YearMonthKey');

const listProperties = (dv) =>
    dv.pages('#real-estate-snapshot and -"meta/templates"')
        .map(p => p.property)
        .distinct();

const latestValueForProperty = (dv, property) =>
    dv.pages('#real-estate-snapshot and -"meta/templates"')
        .where(p => p.property === property)
        .sort(p => p.date, "desc")
        .limit(1)
        .map(p => p.value_estimate)
        .first();

const latestValueForPropertyAsOfYearMonth = (dv, property, yearMonthKey) =>
    dv.pages('#real-estate-snapshot and -"meta/templates"')
        .where(p => p.property === property)
        .where(p => YearMonthKey.isIsoStringNoLaterThanEndOfMonth(p.date, yearMonthKey))
        .sort(p => p.date, "desc")
        .limit(1)
        .map(p => p.value_estimate)
        .first();

const sumLatestValuesForProperties = (dv) =>
    dv.pages('#real-estate-snapshot and -"meta/templates"')
        .groupBy(p => p.property)
        .map(group => group.rows
            .sort(p => p.date, "desc")
            .limit(1)
            .map(p => p.value_estimate)
            .first()
        )
        .sum();

const sumLatestValuesForPropertiesAsOfYearMonth = (dv, yearMonthKey) =>
    dv.pages('#real-estate-snapshot and -"meta/templates"')
        .where(p => YearMonthKey.isIsoStringNoLaterThanEndOfMonth(p.date, yearMonthKey))
        .groupBy(p => p.property)
        .map(group => group.rows
            .sort(p => p.date, "desc")
            .limit(1)
            .map(p => p.value_estimate)
            .first()
        )
        .sum();

module.exports = {
    listProperties,
    latestValueForProperty,
    sumLatestValuesForProperties,
    latestValueForPropertyAsOfYearMonth,
    sumLatestValuesForPropertiesAsOfYearMonth
};