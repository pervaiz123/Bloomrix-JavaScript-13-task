
import {
  fetchCourses,
  loadInitialData
} from "./api.js";

import {
  DEFAULT_FILTERS,
  FILTER_QUERY_PARAM_NAMES,
  normalizeFilters
} from "./constants.js";

import {
  getElements,
  initializeStaticFilters,
  renderCategories,
  renderCourses,
  renderStats,
  setControlsEnabled,
  setFilterValues,
  showEmpty,
  showError,
  showLoading
} from "./ui.js";

import {
  debounce,
  filterAndSortCourses,
  groupCoursesByCategory,
  readFiltersFromUrl,
  readSavedFilters,
  saveFilters,
  updateUrl
} from "./utils.js";


// URL filters take priority over saved preferences.
const urlParams = new URLSearchParams(
  window.location.search
);

const hasUrlFilters = FILTER_QUERY_PARAM_NAMES.some(
  (key) => urlParams.has(key)
);

const storedFilters = hasUrlFilters
  ? readFiltersFromUrl()
  : readSavedFilters();


// Application state.
const state = {
  allCourses: [],
  categories: [],
  filters: {
    ...DEFAULT_FILTERS,
    ...storedFilters
  },
  searchController: null
};

const elements = getElements();


/**
 * Save the current filters to the URL
 * and browser localStorage.
 */
function persistFilters() {
  updateUrl(state.filters);
  saveFilters(state.filters);
}


/**
 * Filter, group, and render current course data.
 */
function renderCurrentResults() {
  // Validate filters BEFORE filtering the courses.
  state.filters = normalizeFilters(
    state.filters,
    state.categories
  );

  const groupedCourses = groupCoursesByCategory(
    state.allCourses
  );

  const matchingCourses = filterAndSortCourses(
    state.allCourses,
    state.filters
  );

  renderCategories(
    state.categories,
    groupedCourses,
    state.filters.category
  );

  renderStats(
    state.allCourses,
    state.categories
  );

  if (matchingCourses.length === 0) {
    showEmpty(state.filters.search);
    return;
  }

  renderCourses(matchingCourses);
}


/**
 * Load courses and categories when the application starts.
 */
async function loadCatalogue() {
  debouncedSearchRequest.cancel();

  state.searchController?.abort();

  state.searchController = null;

  setControlsEnabled(false);

  showLoading(
    "Fetching courses and categories together…"
  );

  try {
    // Both independent JSON files load concurrently.
    const {
      courses,
      categories
    } = await loadInitialData();

    state.allCourses = courses;
    state.categories = categories;

    // Validate URL and saved filters against loaded data.
    state.filters = normalizeFilters(
      state.filters,
      categories
    );

    initializeStaticFilters();

    setControlsEnabled(true);

    setFilterValues(state.filters);

    persistFilters();

    renderCurrentResults();

  } catch (error) {
    showError(
      error.message ||
      "An unexpected error occurred while loading courses."
    );

    setControlsEnabled(false);
  }
}


/**
 * Fetch fresh course data for a searchable request.
 *
 * AbortController cancels the previous request when
 * a new search begins.
 */
async function refreshCoursesForSearch() {
  const controller = new AbortController();

  state.searchController = controller;

  showLoading(
    "Refreshing course data for your search…"
  );

  try {
    const freshCourses = await fetchCourses({
      signal: controller.signal
    });

    // Prevent cancelled requests from rendering old results.
    if (controller.signal.aborted) return;

    state.allCourses = freshCourses;

    renderCurrentResults();

  } catch (error) {
    if (error?.name === "AbortError") return;

    showError(
      error.message ||
      "The search request could not be completed."
    );

  } finally {
    if (state.searchController === controller) {
      state.searchController = null;
    }
  }
}


// Wait until the user pauses typing.
const debouncedSearchRequest = debounce(
  refreshCoursesForSearch,
  350
);


/**
 * Handle course search input.
 */
function handleSearchInput(event) {
  state.filters.search = event.currentTarget.value;

  persistFilters();

  state.searchController?.abort();

  debouncedSearchRequest();
}


/**
 * Handle category, level, and sorting changes.
 */
function handleSelectChange(key, event) {
  state.filters[key] = event.currentTarget.value;

  state.filters = normalizeFilters(
    state.filters,
    state.categories
  );

  setFilterValues(state.filters);

  persistFilters();

  renderCurrentResults();
}


/**
 * Reset search, category, level, and sorting.
 */
function resetFilters() {
  debouncedSearchRequest.cancel();

  state.searchController?.abort();

  state.searchController = null;

  state.filters = {
    ...DEFAULT_FILTERS
  };

  setFilterValues(state.filters);

  persistFilters();

  renderCurrentResults();
}


/**
 * Register application event listeners.
 */
function attachEvents() {
  document
    .querySelector("#filtersForm")
    .addEventListener("submit", (event) => {
      event.preventDefault();
    });

  elements.searchInput.addEventListener(
    "input",
    handleSearchInput
  );

  elements.categorySelect.addEventListener(
    "change",
    (event) => {
      handleSelectChange("category", event);
    }
  );

  elements.levelSelect.addEventListener(
    "change",
    (event) => {
      handleSelectChange("level", event);
    }
  );

  elements.sortSelect.addEventListener(
    "change",
    (event) => {
      handleSelectChange("sort", event);
    }
  );

  elements.clearFiltersButton.addEventListener(
    "click",
    resetFilters
  );

  elements.emptyResetButton.addEventListener(
    "click",
    resetFilters
  );

  elements.retryButton.addEventListener(
    "click",
    loadCatalogue
  );
}


// Initialise the application.
initializeStaticFilters();

attachEvents();

setFilterValues(state.filters);

loadCatalogue();
