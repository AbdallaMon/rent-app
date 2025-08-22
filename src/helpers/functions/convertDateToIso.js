// helpers/functions/convertDateToIso.js
export function convertToISO(dateString) {
  // Assuming dateString is in the format "YYYY-MM-DD"
  const date = new Date(dateString);
  return date.toISOString(); // Return full ISO-8601 format
}
