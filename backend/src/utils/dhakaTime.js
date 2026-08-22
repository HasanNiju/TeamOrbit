// ---------------------------------------------------------------------------
// Server-authoritative Asia/Dhaka time helpers.
//
// PRD §44: the submission window (08:00–20:00) and all stats bucketing must
// be evaluated against the SERVER's clock converted to Asia/Dhaka, never the
// client's reported date/time. Nothing in this file ever reads a value that
// originated from the request body.
// ---------------------------------------------------------------------------

const TIME_ZONE = "Asia/Dhaka";

const partsFormatter = new Intl.DateTimeFormat("en-US", {
  timeZone: TIME_ZONE,
  hour12: false,
  year: "numeric",
  month: "2-digit",
  day: "2-digit",
  hour: "2-digit",
  minute: "2-digit",
  second: "2-digit",
});

function getParts(date = new Date()) {
  const parts = partsFormatter.formatToParts(date);
  const map = {};
  for (const part of parts) {
    if (part.type !== "literal") map[part.type] = part.value;
  }
  return {
    year: Number(map.year),
    month: Number(map.month),
    day: Number(map.day),
    hour: Number(map.hour === "24" ? "0" : map.hour),
    minute: Number(map.minute),
    second: Number(map.second),
  };
}

/** Minutes since midnight, Asia/Dhaka, for the given instant (defaults to now). */
function getDhakaMinutesOfDay(date = new Date()) {
  const { hour, minute } = getParts(date);
  return hour * 60 + minute;
}

/** YYYY-MM-DD calendar date key in Asia/Dhaka. Used to bucket "today". */
function getDhakaDateKey(date = new Date()) {
  const { year, month, day } = getParts(date);
  return `${year}-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
}

const WINDOW_OPEN_MINUTE = 8 * 60; // 08:00
const WINDOW_CLOSE_MINUTE = 20 * 60; // 20:00 (exclusive)

/** PRD §10: 08:00:00 <= now < 20:00:00 Asia/Dhaka. */
function isWithinSubmissionWindow(date = new Date()) {
  const minutes = getDhakaMinutesOfDay(date);
  return minutes >= WINDOW_OPEN_MINUTE && minutes < WINDOW_CLOSE_MINUTE;
}

/** PRD §42: Bangladesh business week is Saturday → Friday. */
function getDhakaWeekStartKey(date = new Date()) {
  const { year, month, day } = getParts(date);
  // Construct a UTC-anchored date object purely to walk the calendar; we
  // only ever read the Y/M/D fields we already resolved in Asia/Dhaka.
  const asUtcNoon = new Date(Date.UTC(year, month - 1, day, 12));
  const jsDay = asUtcNoon.getUTCDay(); // 0=Sun..6=Sat
  const daysSinceSaturday = (jsDay + 1) % 7; // Sat=0, Sun=1, ... Fri=6
  asUtcNoon.setUTCDate(asUtcNoon.getUTCDate() - daysSinceSaturday);
  const y = asUtcNoon.getUTCFullYear();
  const m = String(asUtcNoon.getUTCMonth() + 1).padStart(2, "0");
  const d = String(asUtcNoon.getUTCDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

function getDhakaMonthKey(date = new Date()) {
  const { year, month } = getParts(date);
  return `${year}-${String(month).padStart(2, "0")}`;
}

/** Formats a timestamp as an English date string, e.g. "17 August 2026". */
function formatEnglishDate(date = new Date()) {
  return new Intl.DateTimeFormat("en-GB", {
    timeZone: TIME_ZONE,
    day: "numeric",
    month: "long",
    year: "numeric",
  }).format(date);
}

/** Formats a timestamp as a 12-hour English time string, e.g. "10:42 AM". */
function formatEnglishTime(date = new Date()) {
  return new Intl.DateTimeFormat("en-US", {
    timeZone: TIME_ZONE,
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
  }).format(date);
}

module.exports = {
  TIME_ZONE,
  getDhakaMinutesOfDay,
  getDhakaDateKey,
  getDhakaWeekStartKey,
  getDhakaMonthKey,
  isWithinSubmissionWindow,
  formatEnglishDate,
  formatEnglishTime,
  WINDOW_OPEN_MINUTE,
  WINDOW_CLOSE_MINUTE,
};
