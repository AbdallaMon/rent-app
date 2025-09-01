// collapse tabs/newlines and >4 spaces to keep WABA happy for text params
export function sanitizeForWA(text) {
  if (!text) return "";
  return String(text)
    .replace(/\t+/g, " ")
    .replace(/\r?\n+/g, "\n")
    .replace(/ {5,}/g, "    ")
    .trim();
}
