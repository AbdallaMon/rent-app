export const handleSearchParamsChange = (
  event,
  key,
  searchParams,
  router,
  onChange
) => {
  if (onChange) return onChange(event);
  const value = event.target.value;
  const params = new URLSearchParams(searchParams);
  if (value) {
    params.set(key, value);
  } else {
    params.set(key, "all");
  }
  router.push(`?${params.toString()}`);
};
