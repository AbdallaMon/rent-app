export const formatCurrencyAED = (amount) => {
  if (!amount) return 0;
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

export function fmtSigned(n) {
  const num = Number(n) || 0;
  const abs = Math.abs(num);
  const s = formatCurrencyAED(abs);
  return num > 0 ? `+${s}` : num < 0 ? `-${s}` : s;
}
