export const formatCurrencyAED = (amount) => {
  const formattedAmount = new Intl.NumberFormat("ar-AE", {
    style: "currency",
    currency: "AED",
  }).format(amount);
  return convertToArabicNumerals(formattedAmount);
};

const convertToArabicNumerals = (number) => {
  // const arabicNumerals = ["٠", "١", "٢", "٣", "٤", "٥", "٦", "٧", "٨", "٩"];
  // return number.toString().replace(/\d/g, (digit) => arabicNumerals[digit]);
  return number;
};
