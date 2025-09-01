import { SESSION_TTL_MS, DEFAULT_LANG } from "./services/constants";

const sessions = new Map(); // phone -> { language, step, data, ts }

function now() {
  return Date.now();
}

export function getSession(phone) {
  return sessions.get(phone);
}

export function setSession(phone, patch) {
  const cur = getSession(phone) || {
    language: DEFAULT_LANG,
    step: "greeting",
    data: {},
  };
  const next = { ...cur, ...patch, ts: now() };
  sessions.set(phone, next);
  return next;
}

export function setLanguage(phone, language) {
  return setSession(phone, { language });
}

export function getLanguage(phone) {
  return getSession(phone)?.language || DEFAULT_LANG;
}

// prune old sessions (in-memory)
setInterval(
  () => {
    const cutoff = Date.now() - SESSION_TTL_MS;
    for (const [k, v] of sessions.entries()) {
      if ((v?.ts || 0) < cutoff) sessions.delete(k);
    }
  },
  15 * 60 * 1000
);
