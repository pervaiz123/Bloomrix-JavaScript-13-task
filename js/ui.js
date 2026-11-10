
const elements = {

  searchInput: document.querySelector("#searchInput"),

  categorySelect: document.querySelector("#categorySelect"),

  levelSelect: document.querySelector("#levelSelect"),

  sortSelect: document.querySelector("#sortSelect"),

  clearFiltersButton:
    document.querySelector("#clearFiltersButton"),

  retryButton:
    document.querySelector("#retryButton"),

  emptyResetButton:
    document.querySelector("#emptyResetButton"),

  loadingState:
    document.querySelector("#loadingState"),

  errorState:
    document.querySelector("#errorState"),

  errorMessage:
    document.querySelector("#errorMessage"),

  emptyState:
    document.querySelector("#emptyState"),

  emptyMessage:
    document.querySelector("#emptyMessage"),

  courseGrid:
    document.querySelector("#courseGrid"),

  resultsCount:
    document.querySelector("#resultsCount"),

  categorySummary:
    document.querySelector("#categorySummary"),

  statCourses:
    document.querySelector("#statCourses"),

  statHours:
    document.querySelector("#statHours"),

  statRating:
    document.querySelector("#statRating"),

  statCategories:
    document.querySelector("#statCategories")
};


// Different visual themes for course categories.
const artThemes = {

  "Web Development": [
    "#176a63",
    "#234b72",
    "JS"
  ],

  "Web Design": [
    "#704a9a",
    "#315d87",
    "UI"
  ],

  "Data Science": [
    "#895a2e",
    "#5b477f",
    "DS"
  ],

  "Software Engineering": [
    "#285d8c",
    "#344779",
    "SE"
  ]
};


/**
 * Create an HTML element safely.
 * textContent is used instead of inserting HTML strings.
 */
function createElement(tagName, className, text) {

  const element = document.createElement(tagName);

  if (className) {
    element.className = className;
  }

  if (text !== undefined) {
    element.textContent = String(text);
  }

  return element;
}


/**
 * Create one course card dynamically.
 */
function createCourseCard(course) {

  const [
    startColor,
    endColor,
    mark
  ] = artThemes[course.category] ?? [
    "#315b68",
    "#35466f",
    "LEARN"
  ];

  const card = createElement(
    "article",
    "course-card"
  );

  const art = createElement(
    "div",
    "course-art"
  );

  art.style.setProperty("--art-a", startColor);
  art.style.setProperty("--art-b", endColor);

  art.append(
    createElement(
      "span",
      "course-art-mark",
      mark
    )
  );

  art.append(
    createElement(
      "span",
      "level-pill",
      course.difficulty
    )
  );

  const content = createElement(
    "div",
    "course-content"
  );

  content.append(
    createElement(
      "p",
      "course-category",
      course.category
    )
  );

  content.append(
    createElement(
      "h3",
      "course-title",
      course.title
    )
  );

  content.append(
    createElement(
      "p",
      "course-description",
      course.description
    )
  );

  content.append(
    createElement(
      "p",
      "course-instructor",
      `By ${course.instructor}`
    )
  );

  // Course information.
  const meta = createElement(
    "div",
    "course-meta"
  );

  const rating = createElement(
    "span",
    "rating",
    `★ ${course.rating.toFixed(1)}`
  );

  const duration = createElement(
    "span",
    "",
    `◷ ${course.durationHours} hours`
  );

  const lessons = createElement(
    "span",
    "",
    `▤ ${course.lessons} lessons`
  );

  const students = createElement(
    "span",
    "",
    `${course.students.toLocaleString()} learners`
  );

  meta.append(
    rating,
    duration,
    lessons,
    students
  );

  content.append(meta);

  // Render tags when available.
  if (course.tags?.length) {

    const tagContainer = createElement(
      "div",
      "course-tags"
    );

    course.tags.forEach((tag) => {

      tagContainer.append(
        createElement(
          "span",
          "course-tag",
          tag
        )
      );

    });

    content.append(tagContainer);
  }

  card.append(art, content);

  return card;
}


/**
 * Show only the requested application state.
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
 * Loading state.
 */
export function showLoading(
  message = "Fetching course data…"
) {

  const paragraph =
    elements.loadingState.querySelector("p");

  paragraph.textContent = message;

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
 * Render course cards into the page.
 */
export function renderCourses(courses) {

  const courseCards = courses.map(
    (course) => createCourseCard(course)
  );

  elements.courseGrid.replaceChildren(
    ...courseCards
  );

  elements.resultsCount.textContent =
    `${courses.length} ${
      courses.length === 1
        ? "course"
        : "courses"
    } found`;

  showOnlyState("courses");
}


/**
 * Calculate and display overall catalogue statistics.
 * reduce() is used to calculate the totals.
 */
export function renderStats(courses, categories) {

  const totals = courses.reduce(
    (summary, course) => ({

      hours:
        summary.hours + course.durationHours,

      rating:
        summary.rating + course.rating

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
    courses.length.toString();

  elements.statHours.textContent =
    `${totals.hours}h`;

  elements.statRating.textContent =
    averageRating;

  elements.statCategories.textContent =
    categories.length.toString();
}


/**
 * Render category filter options and category counts.
 */
export function renderCategories(
  categories,
  courses,
  selectedCategory = "all"
) {

  const currentValue = categories.find(
    (category) => category.name === selectedCategory
  )?.name;

  elements.categorySelect.replaceChildren(
    new Option("All categories", "all")
  );

  categories.forEach((category) => {

    const option = new Option(
      category.name,
      category.name
    );

    elements.categorySelect.append(option);

  });

  elements.categorySelect.value =
    currentValue ?? "all";

  // Group courses by category using reduce().
  const grouped = courses.reduce(
    (summary, course) => {

      const category =
        course.category ?? "Uncategorised";

      summary[category] =
        (summary[category] ?? 0) + 1;

      return summary;
    },

    {}
  );

  const chips = Object.entries(grouped).map(
    ([name, count]) => {

      return createElement(
        "span",
        "category-chip",
        `${name} · ${count}`
      );

    }
  );

  elements.categorySummary.replaceChildren(
    ...chips
  );
}


/**
 * Enable or disable form controls.
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
    filters.search ?? "";

  elements.categorySelect.value =
    filters.category ?? "all";

  elements.levelSelect.value =
    filters.level ?? "all";

  elements.sortSelect.value =
    filters.sort ?? "popular";
}


/**
 * Give the application access to DOM elements.
 */
export function getElements() {

  return elements;

}


// Default export.
const ui = {

  showLoading,

  showError,

  showEmpty,

  renderCourses,

  renderStats,

  renderCategories,

  setControlsEnabled,

  setFilterValues,

  getElements

};

export default ui;
