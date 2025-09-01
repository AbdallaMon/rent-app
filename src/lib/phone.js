// /src/lib/phone.js  (JS فقط)
// قائمة الدول المسموحة قابلـة للتغيير من ENV
export const ALLOWED_CC = (process.env.ALLOWED_CC || "971,966,91,20")
  .split(",")
  .map((s) => s.trim())
  .filter(Boolean);

export function cleanDigits(input) {
  if (!input) return "";
  let d = String(input).replace(/[^\d]/g, "");
  if (d.startsWith("00")) d = d.slice(2); // 00xx -> xx
  return d;
}

// يحاول فصل كود الدولة عن الباقي إن وُجد
export function splitCountryCode(digits) {
  const cc = ALLOWED_CC.find((c) => digits.startsWith(c));
  if (cc) return { digits, cc, core: digits.slice(cc.length) };
  const core = digits.startsWith("0") ? digits.slice(1) : digits;
  return { digits, cc: null, core };
}

// يولّد كل الصيغ المحتملة (للبحث في DB)
export function buildPhoneVariants(original) {
  const variants = new Set();
  variants.add(original);

  const cleaned = cleanDigits(original);
  variants.add(cleaned);

  const { cc, core } = splitCountryCode(cleaned);

  if (core) {
    variants.add(core);
    variants.add(`0${core}`);
    for (const c of ALLOWED_CC) {
      variants.add(`${c}${core}`);
      variants.add(`+${c}${core}`);
      variants.add(`${c}0${core}`);
      variants.add(`+${c}0${core}`);
    }
  }

  if (cc && core) {
    variants.add(`${cc}${core}`);
    variants.add(`+${cc}${core}`);
  }

  return Array.from(variants).filter(Boolean);
}

// فحص حد أدنى لصيغة E.164 (أرقام فقط 6–15)
export function isValidE164Digits(digits) {
  return /^\d{6,15}$/.test(digits);
}

// التحقق أن الرقم يبدأ بكود دولة مسموح
export function isAllowedMsisdn(digits) {
  return ALLOWED_CC.some((cc) => digits.startsWith(cc));
}

// صياغة للـ E.164 + التحقق من الدول المسموحة
// - لا "يخمّن" كود دولة؛ لو الرقم فيه كود دولة مسموح => +digits
// - لو Local يبدأ بـ 0 فقط، ومفيهوش CC: هنرُجّع +digits كما هو بعد إزالة الرموز (واتساب عادة يرسل from مع CC أصلاً)
export function formatToE164(msisdn) {
  const digits = cleanDigits(msisdn);
  if (!isValidE164Digits(digits)) {
    throw new Error(`Invalid phone number length: ${digits}`);
  }
  if (isAllowedMsisdn(digits)) {
    return `+${digits}`;
  }
  return `+${digits}`;
}

// اختصار مناسب للإرسال: يرجّع { e164, noPlus, core }
export function normalizePhone(msisdn) {
  const digits = cleanDigits(msisdn);
  const { core } = splitCountryCode(digits);
  return {
    raw: msisdn,
    noPlus: digits, // "2011...."
    e164: formatToE164(msisdn), // "+2011...." أو "+9715...."
    core: core || digits, // "11...." لو 20 موجودة، وإلا digits
    local0: digits.startsWith("20")
      ? `0${digits.slice(2)}`
      : digits.startsWith("0")
        ? digits
        : `0${core || digits}`,
  };
}
