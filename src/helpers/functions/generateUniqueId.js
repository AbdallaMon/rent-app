export const generateUniqueId = () => {
  const milliseconds = new Date().getTime();
  return milliseconds.toString();
};
