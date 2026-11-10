
import api, {
  fetchCourses,
  loadInitialData
} from "./api.js";

import ui from "./ui.js";

import {
  debounce,
  filterAndSortCourses,
  groupCoursesByCategory,
  readFiltersFromUrl,
  readSavedFilters,
  saveFilters,
  updateUrl
} from "./utils.js";


// Default application filters.
const DEFAULT_FILTERS = {

  search: "",

  category: "all",

  level: "all",

  sort: "popular"

};


// Read filter values from the URL.
const urlFilters = readFiltersFromUrl();


// Read previously saved filter values.
const savedFilters = readSavedFilters();


// Check whether URL parameters are available.
const currentParams =
  new URLSearchParams(window.location.search);

const hasUrlFilters = [
  "q",
  "category",
  "level",
  "sort"
].some((key) => currentParams.has(key));


// URL filters take priority over saved filters.
const initialFilters = hasUrlFilters

  ? {
      ...DEFAULT_FILTERS,
      ...urlFilters
    }

  : {
      ...DEFAULT_FILTERS,
      ...savedFilters
    };


// Main application state.
const state = {

  allCourses: [],

  categories: [],

  filters: initialFilters,

  searchController: null,

  loaded: false

};


// Get DOM elements from the UI module.
const elements = ui.getElements();


/**
 * Filter, group, and display the current courses.
 */
function renderCurrentResults() {

  const matchingCourses = filterAndSortCourses(
    state.allCourses,
    state.filters
  );


  const categoryExists =
    state.filters.category === "all"

    || state.categories.find(
      (category) =>
        category.name === state.filters.category
    );


  // Reset invalid category values.
  if (!categoryExists) {
    state.filters.category = "all";
  }


  // Render categories and statistics.
  ui.renderCategories(
    state.categories,
    state.allCourses,
    state.filters.category
  );

  ui.renderStats(
    state.allCourses,
    state.categories
  );


  // Group courses by category.
  const groupedCourses =
    groupCoursesByCategory(matchingCourses);

  console.info(
    "Course groups:",
    Object.keys(groupedCourses)
  );


  // Display the empty state if no courses match.
  if (matchingCourses.length === 0) {

    ui.showEmpty(state.filters.search);

    return;
  }


  // Otherwise render matching course cards.
  ui.renderCourses(matchingCourses);
}


/**
 * Update the URL and save filter preferences.
 */
function persistFilters() {

  updateUrl(state.filters);

  saveFilters(state.filters);

}


/**
 * Load the initial course catalogue.
 */
async function loadCatalogue() {

  state.searchController?.abort();

  ui.setControlsEnabled(false);

  ui.showLoading(
    "Fetching courses and categories together…"
  );


  try {

    // Load courses and categories concurrently.
    const {
      courses,
      categories
    } = await loadInitialData();


    state.allCourses = courses;

    state.categories = categories;

    state.loaded = true;


    // Validate category filter.
    const validCategory = categories.find(
      (category) =>
        category.name === state.filters.category
    );

    if (
      state.filters.category !== "all"
      && !validCategory
    ) {
      state.filters.category = "all";
    }


    // Validate difficulty level.
    if (
      ![
        "all",
        "Beginner",
        "Intermediate",
        "Advanced"
      ].includes(state.filters.level)
    ) {
      state.filters.level = "all";
    }


    // Validate sorting option.
    if (
      ![
        "popular",
        "rating",
        "title",
        "duration"
      ].includes(state.filters.sort)
    ) {
      state.filters.sort = "popular";
    }


    // Make sure the search value is a string.
    state.filters.search =
      typeof state.filters.search === "string"
        ? state.filters.search
        : "";


    // Enable the form after loading.
    ui.setControlsEnabled(true);


    // Restore filter selections.
    ui.setFilterValues(state.filters);


    // Save the final valid filter values.
    persistFilters();


    // Render the application.
    renderCurrentResults();

  } catch (error) {

    console.error(
      "Catalogue loading failed:",
      error
    );

    ui.showError(
      error.message ||
      "An unexpected error occurred while loading courses."
    );

    ui.setControlsEnabled(false);

  }

}


/**
 * Fetch fresh course data for a search request.
 * AbortController cancels an older request when necessary.
 */
async function refreshCoursesForSearch() {

  const controller = new AbortController();

  state.searchController = controller;

  ui.showLoading(
    "Refreshing course data for your search…"
  );


  try {

    const freshCourses = await fetchCourses({
      signal: controller.signal
    });


    // Do not render results from a cancelled request.
    if (controller.signal.aborted) {
      return;
    }


    state.allCourses = freshCourses;

    renderCurrentResults();

  } catch (error) {

    // Ignore cancellation errors.
    if (error?.name === "AbortError") {
      return;
    }


    console.error(
      "Search request failed:",
      error
    );

    ui.showError(
      error.message ||
      "The search request could not be completed."
    );

  } finally {

    if (state.searchController === controller) {
      state.searchController = null;
    }

  }

}


// Debounce the search request by 350 milliseconds.
const debouncedSearchRequest =
  debounce(refreshCoursesForSearch, 350);


/**
 * Search input event handler.
 */
function handleSearchInput(event) {

  state.filters.search =
    event.currentTarget.value;

  persistFilters();


  // Cancel an older active search request.
  state.searchController?.abort();


  // Start the debounced request.
  debouncedSearchRequest();

}


/**
 * Category, level, and sorting event handler.
 */
function handleSelectChange(key, event) {

  state.filters[key] =
    event.currentTarget.value;

  persistFilters();

  renderCurrentResults();

}


/**
 * Reset all filters.
 */
function resetFilters() {

  // Cancel pending and active requests.
  debouncedSearchRequest.cancel();

  state.searchController?.abort();


  // Restore default filter values.
  state.filters = {
    ...DEFAULT_FILTERS
  };


  ui.setFilterValues(state.filters);

  persistFilters();

  renderCurrentResults();

}


/**
 * Register all browser events.
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


// Register event listeners.
attachEvents();


// Restore initial form values.
ui.setFilterValues(state.filters);


// Start loading the application.
loadCatalogue();



void api;
