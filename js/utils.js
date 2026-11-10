
import {
  ALL_FILTER_VALUE,
  DEFAULT_FILTERS,
  FILTER_QUERY_KEYS,
  SORT_BY
} from "./constants.js";

const FILTER_STORAGE_KEY =
  "skillpath-course-filters";


/**
 * Debouncing waits until the user stops
 * triggering an event for the specified delay.
 *
 * timeoutId is retained through a closure.
 */
export function debounce(callback, delay = 300) {
  let timeoutId;

  const debounced = (...args) => {
    clearTimeout(timeoutId);

    timeoutId = setTimeout(
      () => callback(...args),
      delay
    );
  };

  debounced.cancel = () => {
    clearTimeout(timeoutId);
  };

  return debounced;
}


/**
 * Read current filter values from URL parameters.
 */
export function readFiltersFromUrl() {
  const params = new URLSearchParams(
    window.location.search
  );

  return {
    search:
      params.get(FILTER_QUERY_KEYS.SEARCH) ??
      DEFAULT_FILTERS.search,

    category:
      params.get(FILTER_QUERY_KEYS.CATEGORY) ??
      ALL_FILTER_VALUE,

    level:
      params.get(FILTER_QUERY_KEYS.LEVEL) ??
      ALL_FILTER_VALUE,

    sort:
      params.get(FILTER_QUERY_KEYS.SORT) ??
      DEFAULT_FILTERS.sort
  };
}


/**
 * Update URL parameters without reloading the page.
 */
export function updateUrl(filters = DEFAULT_FILTERS) {
  const params = new URLSearchParams(
    window.location.search
  );

  const values = {
    [FILTER_QUERY_KEYS.SEARCH]:
      filters.search?.trim() ?? DEFAULT_FILTERS.search,

    [FILTER_QUERY_KEYS.CATEGORY]:
      filters.category ?? ALL_FILTER_VALUE,

    [FILTER_QUERY_KEYS.LEVEL]:
      filters.level ?? ALL_FILTER_VALUE,

    [FILTER_QUERY_KEYS.SORT]:
      filters.sort ?? DEFAULT_FILTERS.sort
  };

  for (const [key, value] of Object.entries(values)) {
    const isDefault =
      !value ||
      value === ALL_FILTER_VALUE ||
      (
        key === FILTER_QUERY_KEYS.SORT &&
        value === DEFAULT_FILTERS.sort
      );

    if (isDefault) {
      params.delete(key);
    } else {
      params.set(key, value);
    }
  }

  const query = params.toString();

  const nextUrl =
    `${window.location.pathname}` +
    `${query ? `?${query}` : ""}` +
    `${window.location.hash}`;

  window.history.replaceState(
    {},
    "",
    nextUrl
  );
}


/**
 * Save filters in browser localStorage.
 */
export function saveFilters(filters) {
  try {
    window.localStorage.setItem(
      FILTER_STORAGE_KEY,
      JSON.stringify(filters)
    );
  } catch {
    // The application still works when storage is unavailable.
  }
}


/**
 * Restore saved filters from localStorage.
 */
export function readSavedFilters() {
  try {
    const storedValue =
      window.localStorage.getItem(
        FILTER_STORAGE_KEY
      );

    if (!storedValue) return {};

    const parsedValue = JSON.parse(storedValue);

    return (
      parsedValue &&
      typeof parsedValue === "object" &&
      !Array.isArray(parsedValue)
    )
      ? parsedValue
      : {};

  } catch {
    return {};
  }
}


/**
 * Group courses by category using reduce().
 * The UI uses these groups to display category counts.
 */
export function groupCoursesByCategory(courses = []) {
  return courses.reduce((groups, course) => {
    const category =
      course.category ?? "Uncategorised";

    groups[category] ??= [];

    groups[category].push(course);

    return groups;

  }, Object.create(null));
}


/**
 * Search, filter, and sort course records.
 */
export function filterAndSortCourses(
  courses = [],
  filters = DEFAULT_FILTERS
) {
  const searchTerm =
    (filters.search ?? "").trim().toLowerCase();

  const selectedCategory =
    filters.category ?? ALL_FILTER_VALUE;

  const selectedLevel =
    filters.level ?? ALL_FILTER_VALUE;

  const sortBy =
    filters.sort ?? DEFAULT_FILTERS.sort;


  // Filter courses against the selected conditions.
  const matchingCourses = courses.filter((course) => {
    const searchableFields = [
      course.title,
      course.instructor,
      course.category
    ];

    const matchesSearch =
      !searchTerm ||

      searchableFields.some(
        (value) => value.toLowerCase().includes(searchTerm)
      ) ||

      course.tags?.some(
        (tag) => tag.toLowerCase().includes(searchTerm)
      );

    const matchesCategory =
      selectedCategory === ALL_FILTER_VALUE ||
      course.category === selectedCategory;

    const matchesLevel =
      selectedLevel === ALL_FILTER_VALUE ||
      course.difficulty === selectedLevel;

    return (
      matchesSearch &&
      matchesCategory &&
      matchesLevel
    );
  });


  // Keep the original course array unchanged.
  const comparators = {
    [SORT_BY.RATING]: (a, b) => b.rating - a.rating,

    [SORT_BY.TITLE]: (a, b) =>
      a.title.localeCompare(b.title),

    [SORT_BY.DURATION]: (a, b) =>
      a.durationHours - b.durationHours,

    [SORT_BY.POPULAR]: (a, b) =>
      b.students - a.students
  };

  return [...matchingCourses].sort(
    comparators[sortBy] ??
    comparators[DEFAULT_FILTERS.sort]
  );
}