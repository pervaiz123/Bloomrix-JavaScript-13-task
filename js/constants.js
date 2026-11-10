
export const ALL_FILTER_VALUE = "all";

export const SORT_BY = Object.freeze({
  POPULAR: "popular",
  RATING: "rating",
  TITLE: "title",
  DURATION: "duration"
});

export const FILTER_QUERY_KEYS = Object.freeze({
  SEARCH: "q",
  CATEGORY: "category",
  LEVEL: "level",
  SORT: "sort"
});

export const FILTER_QUERY_PARAM_NAMES = Object.freeze(
  Object.values(FILTER_QUERY_KEYS)
);

export const DEFAULT_FILTERS = Object.freeze({
  search: "",
  category: ALL_FILTER_VALUE,
  level: ALL_FILTER_VALUE,
  sort: SORT_BY.POPULAR
});

export const COURSE_LEVELS = Object.freeze([
  "Beginner",
  "Intermediate",
  "Advanced"
]);

export const LEVEL_OPTIONS = Object.freeze([
  { value: ALL_FILTER_VALUE, label: "All levels" },
  ...COURSE_LEVELS.map((level) => ({
    value: level,
    label: level
  }))
]);

export const SORT_OPTIONS = Object.freeze([
  { value: SORT_BY.POPULAR, label: "Most popular" },
  { value: SORT_BY.RATING, label: "Highest rating" },
  { value: SORT_BY.TITLE, label: "Title: A–Z" },
  { value: SORT_BY.DURATION, label: "Shortest duration" }
]);

/**
 * Validate incoming filter values against supported options.
 * Category names come from the loaded categories JSON.
 */
export function normalizeFilters(filters = {}, categories = []) {
  const search =
    typeof filters.search === "string"
      ? filters.search
      : "";

  const requestedCategory =
    filters.category ?? ALL_FILTER_VALUE;

  const requestedLevel =
    filters.level ?? ALL_FILTER_VALUE;

  const requestedSort =
    filters.sort ?? DEFAULT_FILTERS.sort;

  const matchedCategory = categories.find(
    (category) => category.name === requestedCategory
  );

  const validLevel = LEVEL_OPTIONS.find(
    (option) => option.value === requestedLevel
  );

  const validSort = SORT_OPTIONS.find(
    (option) => option.value === requestedSort
  );

  return {
    search,

    category:
      requestedCategory === ALL_FILTER_VALUE
        ? ALL_FILTER_VALUE
        : matchedCategory?.name ?? ALL_FILTER_VALUE,

    level: validLevel?.value ?? ALL_FILTER_VALUE,

    sort: validSort?.value ?? DEFAULT_FILTERS.sort
  };
}
