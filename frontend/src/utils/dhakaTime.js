// All submission-window logic must be evaluated in Asia/Dhaka time,
// independent of the device's local timezone/clock. Bangladesh has a single
// fixed UTC+6 offset with no DST, but we still derive it via Intl so this
// keeps working correctly if that ever changes, and so it matches whatever
// the real backend does with the same IANA zone.
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

const banglaDateFormatter = new Intl.DateTimeFormat("bn-BD", {
  timeZone: TIME_ZONE,
  day: "numeric",
  month: "long",
  year: "numeric",
});

const englishDateFormatter = new Intl.DateTimeFormat("en-GB", {
  timeZone: TIME_ZONE,
  day: "numeric",
  month: "long",
  year: "numeric",
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
    hour: Number(map.hour),
    minute: Number(map.minute),
    second: Number(map.second),
  };
}

/** Minutes since midnight, Asia/Dhaka. */
export function getDhakaMinutesOfDay(date = new Date()) {
  const { hour, minute } = getParts(date);
  return hour * 60 + minute;
}

/** ISO-like YYYY-MM-DD calendar date in Asia/Dhaka, used to bucket "today". */
export function getDhakaDateKey(date = new Date()) {
  const { year, month, day } = getParts(date);
  return `${year}-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
}

const WINDOW_OPEN_MINUTES = 8 * 60; // 08:00
const WINDOW_CLOSE_MINUTES = 20 * 60; // 20:00

/**
 * Mirrors the required server-side rule: 08:00:00 <= now < 20:00:00 (Dhaka).
 * The client uses this only to decide what to show; final enforcement must
 * happen again on the server when a real backend replaces the mock API.
 */
export function isWithinSubmissionWindow(date = new Date()) {
  const minutes = getDhakaMinutesOfDay(date);
  return minutes >= WINDOW_OPEN_MINUTES && minutes < WINDOW_CLOSE_MINUTES;
}

export function getSubmissionWindowState(date = new Date()) {
  const minutes = getDhakaMinutesOfDay(date);
  if (minutes < WINDOW_OPEN_MINUTES) return "before";
  if (minutes >= WINDOW_CLOSE_MINUTES) return "after";
  return "open";
}

export function formatDhakaDate(language, date = new Date()) {
  return language === "bn" ? banglaDateFormatter.format(date) : englishDateFormatter.format(date);
}
