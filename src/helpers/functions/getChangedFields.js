export function getChangedFields(initialData, currentData) {
  const changes = {};

  Object.keys(currentData).forEach((key) => {
    if (initialData[key] != currentData[key]) {
      changes[key] = currentData[key];
    }
  });
  return changes;
}
