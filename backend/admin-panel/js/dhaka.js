// Mirrors src/utils/dhakaTime.js on the server, used only to build filter
// preset date ranges in the UI. The server re-validates/derives everything
// authoritatively — this is just for building query params.

const TIME_ZONE = "Asia/Dhaka";

function parts(date = new Date()) {
  const fmt = new Intl.DateTimeFormat("en-US", {
    timeZone: TIME_ZONE,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  });
  const map = {};
  fmt.formatToParts(date).forEach((p) => { if (p.type !== "literal") map[p.type] = p.value; });
  return { year: Number(map.year), month: Number(map.month), day: Number(map.day) };
}

export function dhakaDateKey(date = new Date()) {
  const { year, month, day } = parts(date);
  return `${year}-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
}

function dhakaDateKeyOffset(daysOffset, date = new Date()) {
  const { year, month, day } = parts(date);
  const d = new Date(Date.UTC(year, month - 1, day, 12));
  d.setUTCDate(d.getUTCDate() + daysOffset);
  return `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, "0")}-${String(d.getUTCDate()).padStart(2, "0")}`;
}

export function dhakaWeekStartKey(date = new Date()) {
  const { year, month, day } = parts(date);
  const d = new Date(Date.UTC(year, month - 1, day, 12));
  const jsDay = d.getUTCDay(); // 0=Sun..6=Sat
  const sinceSaturday = (jsDay + 1) % 7;
  d.setUTCDate(d.getUTCDate() - sinceSaturday);
  return `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, "0")}-${String(d.getUTCDate()).padStart(2, "0")}`;
}

export function dhakaMonthStartKey(date = new Date()) {
  const { year, month } = parts(date);
  return `${year}-${String(month).padStart(2, "0")}-01`;
}

/** Returns { dateFrom, dateTo } for a named preset, or {} for "all"/"custom". */
export function presetRange(preset) {
  const today = dhakaDateKey();
  switch (preset) {
    case "today":
      return { dateFrom: today, dateTo: today };
    case "yesterday": {
      const y = dhakaDateKeyOffset(-1);
      return { dateFrom: y, dateTo: y };
    }
    case "week":
      return { dateFrom: dhakaWeekStartKey(), dateTo: today };
    case "month":
      return { dateFrom: dhakaMonthStartKey(), dateTo: today };
    default:
      return {};
  }
}
