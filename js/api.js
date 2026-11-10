
import { COURSE_LEVELS } from "./constants.js";

const COURSES_URL = new URL(
  "../data/courses.json",
  import.meta.url
);

const CATEGORIES_URL = new URL(
  "../data/categories.json",
  import.meta.url
);

/**
 * Fetch JSON with cancellation, timeout,
 * and HTTP and JSON response validation.
 */
export async function fetchJson(
  url,
  {
    signal,
    timeoutMs = 10000,
    headers = {}
  } = {}
) {
  const controller = new AbortController();

  let timeoutId;
  let timedOut = false;

  const forwardAbort = () => {
    controller.abort(signal?.reason);
  };

  if (signal?.aborted) {
    controller.abort(signal.reason);
  } else {
    signal?.addEventListener(
      "abort",
      forwardAbort,
      { once: true }
    );
  }

  const timeoutPromise = new Promise((resolve, reject) => {
    timeoutId = setTimeout(() => {
      timedOut = true;
      controller.abort();

      reject(
        new Error(`The request timed out after ${timeoutMs} ms.`)
      );
    }, timeoutMs);
  });

  try {
    const response = await Promise.race([
      fetch(url, {
        method: "GET",

        headers: {
          Accept: "application/json",
          ...headers
        },

        signal: controller.signal
      }),

      timeoutPromise
    ]);

    if (!response.ok) {
      throw new Error(
        `HTTP ${response.status}: ${
          response.statusText || "The request failed."
        }`
      );
    }

    const contentType =
      response.headers.get("content-type") ?? "";

    if (
      contentType &&
      !contentType.toLowerCase().includes("application/json")
    ) {
      throw new Error(
        "The server response was not JSON."
      );
    }

    try {
      return await response.json();
    } catch (error) {
      if (error instanceof SyntaxError) {
        throw new Error(
          "The server returned empty or invalid JSON."
        );
      }

      throw error;
    }

  } catch (error) {
    if (timedOut) {
      throw new Error(
        `The request timed out after ${timeoutMs} ms.`
      );
    }

    if (error?.name === "AbortError") {
      throw error;
    }

    if (error instanceof TypeError) {
      throw new Error(
        "A network error occurred. Check that the local server is running."
      );
    }

    throw error;

  } finally {
    clearTimeout(timeoutId);

    signal?.removeEventListener(
      "abort",
      forwardAbort
    );
  }
}


/**
 * Convert values into safe numbers.
 */
function toSafeNumber(value, fallback = 0) {
  const numberValue = Number(value);

  return Number.isFinite(numberValue)
    ? numberValue
    : fallback;
}


/**
 * Validate course records and normalise
 * missing or unexpected properties.
 */
export function validateCourses(payload) {
  if (!Array.isArray(payload)) {
    throw new TypeError(
      "The courses data must be a JSON array."
    );
  }

  return payload

    .map((record, index) => {
      if (
        !record ||
        typeof record !== "object" ||
        Array.isArray(record)
      ) {
        return null;
      }

      const title =
        typeof record.title === "string"
          ? record.title.trim()
          : "";

      if (!title) return null;

      const tags = Array.isArray(record.tags)
        ? record.tags
            .filter((tag) => typeof tag === "string")
            .slice(0, 8)
        : [];

      return {
        ...record,

        id: String(
          record.id ?? `course-${index + 1}`
        ),

        title,

        instructor:
          typeof record.instructor === "string" &&
          record.instructor.trim()
            ? record.instructor.trim()
            : "Instructor TBA",

        category:
          typeof record.category === "string" &&
          record.category.trim()
            ? record.category.trim()
            : "General",

        difficulty:
          COURSE_LEVELS.includes(record.difficulty)
            ? record.difficulty
            : "Unspecified",

        durationHours: Math.max(
          0,
          toSafeNumber(record.durationHours)
        ),

        rating: Math.min(
          5,
          Math.max(0, toSafeNumber(record.rating))
        ),

        students: Math.max(
          0,
          toSafeNumber(record.students)
        ),

        lessons: Math.max(
          0,
          toSafeNumber(record.lessons)
        ),

        description:
          typeof record.description === "string"
            ? record.description
            : "Course details will be added soon.",

        tags,

        updatedAt:
          typeof record.updatedAt === "string"
            ? record.updatedAt
            : ""
      };
    })

    .filter(Boolean);
}


/**
 * Validate category records.
 */
export function validateCategories(payload) {
  if (!Array.isArray(payload)) {
    throw new TypeError(
      "The categories data must be a JSON array."
    );
  }

  return payload

    .filter((category) => (
      category &&
      typeof category === "object" &&
      !Array.isArray(category)
    ))

    .map((category) => ({
      id: String(category.id ?? ""),

      name:
        typeof category.name === "string"
          ? category.name.trim()
          : ""
    }))

    .filter(
      (category) => category.id && category.name
    );
}


/**
 * Load courses and categories concurrently.
 */
export async function loadInitialData({ signal } = {}) {
  const [
    coursePayload,
    categoryPayload
  ] = await Promise.all([
    fetchJson(COURSES_URL, { signal }),
    fetchJson(CATEGORIES_URL, { signal })
  ]);

  return {
    courses: validateCourses(coursePayload),
    categories: validateCategories(categoryPayload)
  };
}


/**
 * Fetch fresh course data for the cancellable
 * search request.
 */
export async function fetchCourses({ signal } = {}) {
  const payload = await fetchJson(
    COURSES_URL,
    { signal }
  );

  return validateCourses(payload);
}