
const FILTER_STORAGE_KEY =
  "skillpath-course-filters";


/**
 * Debounce function.
 *
 * It delays callback execution until the user
 * stops performing an action for the given time.
 *
 * The timeoutId variable is retained in a closure.
 */
export function debounce(
  callback,
  delay = 300
) {

  let timeoutId;

  const debounced = (...args) => {

    clearTimeout(timeoutId);

    timeoutId = setTimeout(
      () => callback(...args),
      delay
    );

  };


  // Cancel a pending debounced callback.
  debounced.cancel = () => {
    clearTimeout(timeoutId);
  };


  return debounced;

}


/**
 * Throttle function.
 *
 * It allows the callback to execute
 * at most once during a time window.
 */
export function throttle(
  callback,
  delay = 200
) {

  let waiting = false;

  return (...args) => {

    if (waiting) {
      return;
    }

    callback(...args);

    waiting = true;

    setTimeout(() => {

      waiting = false;

    }, delay);

  };

}


/**
 * Read filters from the browser URL.
 *
 * URLSearchParams reads query parameters.
 */
export function readFiltersFromUrl() {

  const params = new URLSearchParams(
    window.location.search
  );

  return {

    search: params.get("q") ?? "",

    category: params.get("category") ?? "all",

    level: params.get("level") ?? "all",

    sort: params.get("sort") ?? "popular"

  };

}


/**
 * Update URL query parameters when filters change.
 */
export function updateUrl(filters = {}) {

  const params = new URLSearchParams(
    window.location.search
  );


  // Destructure filter properties with defaults.
  const values = {

    q: filters.search?.trim() ?? "",

    category: filters.category ?? "all",

    level: filters.level ?? "all",

    sort: filters.sort ?? "popular"

  };


  // Update or remove query parameters.
  for (const [key, value] of Object.entries(values)) {

    if (
      value &&
      value !== "all" &&
      value !== "popular"
    ) {

      params.set(key, value);

    } else {

      params.delete(key);

    }

  }


  const query = params.toString();

  const nextUrl =
    `${window.location.pathname}` +
    `${query ? `?${query}` : ""}` +
    `${window.location.hash}`;


  // Update URL without reloading the page.
  window.history.replaceState(
    {},
    "",
    nextUrl
  );

}


/**
 * Save filters to localStorage.
 *
 * JSON.stringify converts JavaScript data into JSON text.
 */
export function saveFilters(filters) {

  try {

    window.localStorage.setItem(
      FILTER_STORAGE_KEY,
      JSON.stringify(filters)
    );

  } catch (error) {

    console.warn(
      "Could not save course filters:",
      error
    );

  }

}


/**
 * Restore saved filters from localStorage.
 *
 * JSON.parse converts JSON text into JavaScript data.
 */
export function readSavedFilters() {

  try {

    const storedValue =
      window.localStorage.getItem(
        FILTER_STORAGE_KEY
      );


    if (!storedValue) {
      return {};
    }


    const parsedValue =
      JSON.parse(storedValue);


    return (
      parsedValue &&
      typeof parsedValue === "object" &&
      !Array.isArray(parsedValue)
    )

      ? parsedValue

      : {};

  } catch (error) {

    console.warn(
      "Saved course filters were not valid JSON:",
      error
    );

    return {};

  }

}


/**
 * Group courses by category using reduce().
 */
export function groupCoursesByCategory(
  courses = []
) {

  return courses.reduce(
    (groups, course) => {

      const categoryName =
        course.category ?? "Uncategorised";


      // Create an array if the category does not exist.
      groups[categoryName] ??= [];


      // Add this course to its category.
      groups[categoryName].push(course);

      return groups;

    },

    {}
  );

}


/**
 * Search, filter, and sort the loaded courses.
 */
export function filterAndSortCourses(
  courses = [],
  filters = {}
) {

  const searchTerm =
    (filters.search ?? "").trim().toLowerCase();

  const selectedCategory =
    filters.category ?? "all";

  const selectedLevel =
    filters.level ?? "all";

  const sortBy =
    filters.sort ?? "popular";


  // FILTER: Find courses matching all selected conditions.
  const matchingCourses = courses.filter(
    (course) => {

      const searchableFields = [

        course.title,

        course.instructor,

        course.category

      ];


      // SEARCH: Look inside title, instructor, category, and tags.
      const matchesSearch =
        !searchTerm

        || searchableFields.some(
          (value) =>
            value.toLowerCase().includes(searchTerm)
        )

        || course.tags?.some(
          (tag) =>
            tag.toLowerCase().includes(searchTerm)
        );


      const matchesCategory =
        selectedCategory === "all" ||
        course.category === selectedCategory;


      const matchesLevel =
        selectedLevel === "all" ||
        course.difficulty === selectedLevel;


      return (
        matchesSearch &&
        matchesCategory &&
        matchesLevel
      );

    }
  );


  // Create a copy so the original data is not modified.
  const sortedCourses = [
    ...matchingCourses
  ];


  // SORT: Choose the correct comparison function.
  const comparators = {

    rating: (a, b) =>
      b.rating - a.rating,

    title: (a, b) =>
      a.title.localeCompare(b.title),

    duration: (a, b) =>
      a.durationHours - b.durationHours,

    popular: (a, b) =>
      b.students - a.students

  };


  sortedCourses.sort(
    comparators[sortBy] ??
    comparators.popular
  );


  return sortedCourses;

}