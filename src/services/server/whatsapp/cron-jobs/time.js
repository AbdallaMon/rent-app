// lib/time.js
const DUBAI_TZ = "Asia/Dubai";
const dayjs = require("dayjs");
const utc = require("dayjs/plugin/utc");
const timezone = require("dayjs/plugin/timezone");
dayjs.extend(utc);
dayjs.extend(timezone);
function parseHMS(hms = "09:00:00") {
  const [h = 0, m = 0, s = 0] = hms.split(":").map(Number);
  return { h, m, s };
}

function setTime(d, h, m, s) {
  const x = new Date(d);
  x.setHours(h, m, s, 0);
  return x;
}
const DAY_NAME_TO_INDEX = {
  Sunday: 0,
  Monday: 1,
  Tuesday: 2,
  Wednesday: 3,
  Thursday: 4,
  Friday: 5,
  Saturday: 6,
};
function normalizeWorkingDays(rawDays) {
  if (!rawDays) return [0, 1, 2, 3, 4, 5]; // default
  if (typeof rawDays[0] === "number") return rawDays; // already numeric

  // map from names to indices
  return rawDays
    .map((d) => DAY_NAME_TO_INDEX[d])
    .filter((n) => n !== undefined);
}
function isWithinWorkingHours(now, settings) {
  const days = normalizeWorkingDays(settings.workingDays);
  const dow = now.getDay();

  if (!days.includes(dow)) return false;

  const {
    h: sh,
    m: sm,
    s: ss,
  } = parseHMS(settings.workingHoursStart || "09:00:00");
  const {
    h: eh,
    m: em,
    s: es,
  } = parseHMS(settings.workingHoursEnd || "18:00:00");

  const start = setTime(now, sh, sm, ss);
  let end = setTime(now, eh, em, es);

  // If end is "earlier" than start, it means the window crosses midnight → push end to next day
  if (end <= start) {
    end = new Date(end);
    end.setDate(end.getDate() + 1);
  }
  return now >= start && now <= end;
}

function daysUntil(date, from = new Date()) {
  const a = new Date(from.getFullYear(), from.getMonth(), from.getDate());
  const b = new Date(date.getFullYear(), date.getMonth(), date.getDate());
  const diffMs = b - a;
  return Math.round(diffMs / (1000 * 60 * 60 * 24));
}

function daysSince(date, from = new Date()) {
  const a = new Date(from.getFullYear(), from.getMonth(), from.getDate());
  const b = new Date(date.getFullYear(), date.getMonth(), date.getDate());
  const diffMs = a - b;
  return Math.round(diffMs / (1000 * 60 * 60 * 24));
}

function sleep(ms) {
  return new Promise((r) => setTimeout(r, ms));
}
function formatDateDubai(date) {
  return dayjs(date).tz(DUBAI_TZ).format("YYYY-MM-DD");
}
function nowDubai(base = new Date()) {
  return new Date(dayjs(base).tz(DUBAI_TZ).format());
}
module.exports = {
  formatDateDubai,
  isWithinWorkingHours,
  daysUntil,
  daysSince,
  sleep,
  nowDubai,
};
