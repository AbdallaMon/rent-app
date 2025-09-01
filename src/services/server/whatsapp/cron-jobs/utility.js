const DEFAULT_CC = "+20"; // #todo change to uae

function onlyDigits(s = "") {
  return (s || "").replace(/\D+/g, "");
}

// يحوّل 0501234567 -> +971501234567
function normalizePhone(raw, defaultCc = DEFAULT_CC) {
  if (!raw) return null;
  const s = String(raw).trim();

  // لو الرقم أصلاً دولي
  if (s.startsWith("+")) return s;

  // 00 -> +
  if (s.startsWith("00")) return "+" + onlyDigits(s.slice(2));

  const digits = onlyDigits(s);

  // نمط الإمارات الشائع: 05X...
  if (/^05\d{7,9}$/.test(digits)) {
    // 05XXXXXXXX -> +9715XXXXXXXX
    return defaultCc + digits.slice(1);
  }

  // رقم يبدأ بـ 0 ومفيش كود
  if (/^0\d{7,12}$/.test(digits)) {
    return defaultCc + digits.slice(1);
  }

  // رقم بدون كود وميبدأش بـ 0
  if (/^\d{7,12}$/.test(digits)) {
    return defaultCc + digits;
  }

  // آخر محاولة: لو فيه أي ديجيتس هنلزق الكود الافتراضي
  return defaultCc + digits;
}
module.exports = {
  normalizePhone,
};
