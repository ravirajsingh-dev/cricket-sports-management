const mongoose = require("mongoose");

const escapeRegex = (value) =>
  String(value).replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

/**
 * Generate MongoDB query filters for search and filtering.
 * @param {Array} filters - Array of filter field keys (e.g. ['name', 'status'])
 * @param {Object} query - Object with search/filter criteria
 * @returns {Object} MongoDB filter object
 */
const processSearchFilters = (filters, query) => {
  const filtersSearchArgs = {};
  const filtersFilterArgs = {};
  const orSearch = [];
  const andFilter = [];

  // Sanity check
  if (!Array.isArray(filters) || typeof query !== "object") return {};

  const processSearchItem = (key, filter) => {
    const { value, type } = filter;
    if (!value || !type) return {};

    switch (type) {
      case "id":
        if (mongoose.Types.ObjectId.isValid(value)) {
          return { [key]: mongoose.Types.ObjectId(value) };
        }
        return {};
      case "Number":
        return { [key]: parseInt(value) };
      case "String":
        return { [key]: { $regex: escapeRegex(value), $options: "i" } };
      case "Array":
        return { [key]: { $in: Array.isArray(value) ? value : [value] } };
      default:
        return {};
    }
  };

  const processFilterItem = (key, filter) => {
    const { value, type } = filter;
    if (!value || !type) return {};

    switch (type) {
      case "id":
        if (mongoose.Types.ObjectId.isValid(value)) {
          return { [key]: mongoose.Types.ObjectId(value) };
        }
        return {};
      case "Number":
        return { [key]: parseInt(value) };
      case "String":
        return { [key]: value.toString() };
      case "string":
        return { [key]: String(value).trim() };
      case "Date": {
        // Date range filter: "start|end" (ISO or YYYY-MM-DD)
        const dateParts = String(value).includes("|")
          ? String(value).split("|")
          : [value, value];

        const startDateStr = dateParts[0]?.trim();
        const endDateStr = dateParts[1]?.trim();

        if (!startDateStr || !endDateStr) return {};

        let start;
        let end;

        if (startDateStr && !startDateStr.includes(":") && !startDateStr.includes("T")) {
          start = new Date(startDateStr + "T00:00:00.000Z");
        } else {
          start = new Date(startDateStr);
        }

        if (endDateStr && !endDateStr.includes(":") && !endDateStr.includes("T")) {
          end = new Date(endDateStr + "T23:59:59.999Z");
        } else {
          end = new Date(endDateStr);
        }

        if (isNaN(start.getTime()) || isNaN(end.getTime())) {
          console.error("Invalid date range:", { startDateStr, endDateStr, start, end });
          return {};
        }

        return {
          [key]: {
            $gte: start,
            $lte: end,
          },
        };
      }
      case "Boolean":
        return { [key]: value === "1" || value === true };
      default:
        return {};
    }
  };

  filters.forEach((key) => {
    if (key === "search" && query[key]) {
      const searchGroup = query[key];
      if (typeof searchGroup === "object") {
        for (let searchKey in searchGroup) {
          const searchCondition = processSearchItem(
            searchKey,
            searchGroup[searchKey]
          );
          if (Object.keys(searchCondition).length > 0) {
            orSearch.push(searchCondition);
          }
        }
      }
    } else if (query[key]) {
      const filterCondition = processFilterItem(key, query[key]);
      if (Object.keys(filterCondition).length > 0) {
        andFilter.push(filterCondition);
      }
    }
  });

  if (orSearch.length) filtersSearchArgs.$or = orSearch;
  if (andFilter.length) filtersFilterArgs.$and = andFilter;

  return { ...filtersSearchArgs, ...filtersFilterArgs };
};

module.exports = { processSearchFilters, escapeRegex };
