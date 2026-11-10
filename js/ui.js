
import {
  ALL_FILTER_VALUE,
  DEFAULT_FILTERS,
  LEVEL_OPTIONS,
  SORT_OPTIONS
} from "./constants.js";

const elements = {
  searchInput: document.querySelector("#searchInput"),
  categorySelect: document.querySelector("#categorySelect"),
  levelSelect: document.querySelector("#levelSelect"),
  sortSelect: document.querySelector("#sortSelect"),
  clearFiltersButton: document.querySelector("#clearFiltersButton"),
  retryButton: document.querySelector("#retryButton"),
  emptyResetButton: document.querySelector("#emptyResetButton"),
  loadingState: document.querySelector("#loadingState"),
  errorState: document.querySelector("#errorState"),
  errorMessage: document.querySelector("#errorMessage"),
  emptyState: document.querySelector("#emptyState"),
  emptyMessage: document.querySelector("#emptyMessage"),
  courseGrid: document.querySelector("#courseGrid"),
  resultsCount: document.querySelector("#resultsCount"),
  categorySummary: document.querySelector("#categorySummary"),
  statCourses: document.querySelector("#statCourses"),
  statHours: document.querySelector("#statHours"),
  statRating: document.querySelector("#statRating"),
  statCategories: document.querySelector("#statCategories")
};

const artThemes = {
  "Web Development": ["#176a63", "#234b72", "JS"],
  "Web Design": ["#704a9a", "#315d87", "UI"],
  "Data Science": ["#895a2e", "#5b477f", "DS"],
  "Software Engineering": ["#285d8c", "#344779", "SE"]
};

function createElement(tagName, className = "", text = undefined) {
  const element = document.createElement(tagName);

  if (className) {
    element.className = className;
  }

  if (text !== undefined) {
    element.textContent = String(text);
  }

  return element;
}

function createOption(label, value) {
  const option = document.createElement("option");

  option.value = value;
  option.textContent = label;

  return option;
}


/**
 * Create a course card using DOM elements.
 * textContent prevents incoming data from being treated as HTML.
 */
function createCourseCard(course) {
  const theme = Object.hasOwn(artThemes, course.category)
    ? artThemes[course.category]
    : ["#315b68", "#35466f", "LEARN"];

  const [startColor, endColor, mark] = theme;

  const card = createElement("article", "course-card");
  const art = createElement("div", "course-art");

  art.style.setProperty("--art-a", startColor);
  art.style.setProperty("--art-b", endColor);

  art.append(
    createElement("span", "course-art-mark", mark),
    createElement("span", "level-pill", course.difficulty)
  );

  const content = createElement("div", "course-content");

  content.append(
    createElement("p", "course-category", course.category),
    createElement("h3", "course-title", course.title),
    createElement("p", "course-description", course.description),
    createElement("p", "course-instructor", `By ${course.instructor}`)
  );

  const meta = createElement("div", "course-meta");

  meta.append(
    createElement("span", "rating", `★ ${course.rating.toFixed(1)}`),
    createElement("span", "", `◷ ${course.durationHours} hours`),
    createElement("span", "", `▤ ${course.lessons} lessons`),
    createElement("span", "", `${course.students.toLocaleString()} learners`)
  );

  content.append(meta);

  if (course.tags.length) {
    const tagContainer = createElement("div", "course-tags");

    course.tags.forEach((tag) => {
      tagContainer.append(
        createElement("span", "course-tag", tag)
      );
    });

    content.append(tagContainer);
  }

  card.append(art, content);

  return card;
}


/**
 * Display only the requested application state.
 */
function showOnlyState(stateToShow) {
  elements.loadingState.hidden =
    stateToShow !== "loading";

  elements.errorState.hidden =
    stateToShow !== "error";

  elements.emptyState.hidden =
    stateToShow !== "empty";

  elements.courseGrid.hidden =
    stateToShow !== "courses";

  elements.courseGrid.setAttribute(
    "aria-busy",
    String(stateToShow === "loading")
  );
}


/**
 * Generate level and sorting dropdown options
 * using the shared constants.
 */
export function initializeStaticFilters() {
  elements.levelSelect.replaceChildren(
    ...LEVEL_OPTIONS.map(({ label, value }) =>
      createOption(label, value)
    )
  );

  elements.sortSelect.replaceChildren(
    ...SORT_OPTIONS.map(({ label, value }) =>
      createOption(label, value)
    )
  );
}


/**
 * Loading state.
 */
export function showLoading(message = "Fetching course data…") {
  elements.loadingState.querySelector("p").textContent = message;

  elements.courseGrid.replaceChildren();

  elements.resultsCount.textContent = "Loading…";

  showOnlyState("loading");
}


/**
 * Error state.
 */
export function showError(message) {
  elements.errorMessage.textContent =
    message || "Please try again.";

  elements.courseGrid.replaceChildren();

  elements.resultsCount.textContent =
    "Catalogue unavailable";

  showOnlyState("error");
}


/**
 * Empty state.
 */
export function showEmpty(search = "") {
  elements.emptyMessage.textContent = search

    ? `No courses matched “${search}”. Try a different keyword or clear your filters.`

    : "There are no courses to display with the selected filters.";

  elements.courseGrid.replaceChildren();

  elements.resultsCount.textContent = "0 courses";

  showOnlyState("empty");
}


/**
 * Render the matching course cards.
 */
export function renderCourses(courses) {
  const cards = courses.map(
    (course) => createCourseCard(course)
  );

  elements.courseGrid.replaceChildren(...cards);

  elements.resultsCount.textContent =
    `${courses.length} ${
      courses.length === 1 ? "course" : "courses"
    } found`;

  showOnlyState("courses");
}


/**
 * Calculate and display catalogue statistics.
 */
export function renderStats(courses, categories) {
  const totals = courses.reduce(
    (summary, course) => ({
      hours: summary.hours + course.durationHours,
      rating: summary.rating + course.rating
    }),

    {
      hours: 0,
      rating: 0
    }
  );

  const averageRating = courses.length

    ? (totals.rating / courses.length).toFixed(1)

    : "—";

  elements.statCourses.textContent =
    String(courses.length);

  elements.statHours.textContent =
    `${totals.hours}h`;

  elements.statRating.textContent =
    averageRating;

  elements.statCategories.textContent =
    String(categories.length);
}


/**
 * Render category dropdown options and category counts.
 * groupedCourses is calculated in utils.js and actually
 * used here rather than being sent to the console.
 */
export function renderCategories(
  categories,
  groupedCourses,
  selectedCategory = ALL_FILTER_VALUE
) {
  const options = [
    createOption("All categories", ALL_FILTER_VALUE),

    ...categories.map(({ name }) =>
      createOption(name, name)
    )
  ];

  elements.categorySelect.replaceChildren(...options);

  const validSelection = categories.find(
    (category) => category.name === selectedCategory
  );

  elements.categorySelect.value =
    validSelection?.name ?? ALL_FILTER_VALUE;

  const chips = Object.entries(groupedCourses).map(
    ([name, courses]) =>
      createElement(
        "span",
        "category-chip",
        `${name} · ${courses.length}`
      )
  );

  elements.categorySummary.replaceChildren(...chips);
}


/**
 * Enable or disable filter controls.
 */
export function setControlsEnabled(enabled) {
  [
    elements.searchInput,
    elements.categorySelect,
    elements.levelSelect,
    elements.sortSelect,
    elements.clearFiltersButton
  ].forEach((control) => {
    control.disabled = !enabled;
  });
}


/**
 * Restore filter values in the form.
 */
export function setFilterValues(filters) {
  elements.searchInput.value =
    filters.search ?? DEFAULT_FILTERS.search;

  elements.categorySelect.value =
    filters.category ?? ALL_FILTER_VALUE;

  elements.levelSelect.value =
    filters.level ?? ALL_FILTER_VALUE;

  elements.sortSelect.value =
    filters.sort ?? DEFAULT_FILTERS.sort;
}


/**
 * Give app.js access to the required DOM elements.
 */
export function getElements() {
  return elements;
}
