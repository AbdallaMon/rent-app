// /src/lib/phone.js  (JS فقط)

// 1) الدول المسموحة + ترتيب الأطول أولاً لتجنب تصادم البادئات (مثلاً 971 vs 91)
export const ALLOWED_CC = (process.env.ALLOWED_CC || "971,966,91,20")
  .split(",")
  .map((s) => s.trim())
  .filter(Boolean)
  .sort((a, b) => b.length - a.length);

// 2) دولة افتراضية عند الغموض
export const DEFAULT_CC = process.env.DEFAULT_CC || "971";

const PREFIX_TO_CC = {
  "010": "20",
  "011": "20",
  "012": "20",
  "015": "20",

  "052": "971",

  "053": "966",
  "057": "966",
  "059": "966",
};

const LOCAL_PATTERNS = {
  // Egypt
  20: [
    /^0?1[0125]\d{8}$/, // mobile: 01x + 8 digits (مع أو بدون 0)
    /^0?2\d{8}$/, // landline Cairo (اختياري)
  ],
  // UAE
  971: [/^0?5[024568]\d{7}$/], // 05x + 7 digits
  // KSA
  966: [/^0?5\d{8}$/], // 05x + 8 digits
  // India
  91: [/^0?[6-9]\d{9}$/], // 10 digits تبدأ من 6-9 (مع أو بدون 0)
};

export function cleanDigits(input) {
  if (!input) return "";
  let d = String(input).replace(/[^\d]/g, "");
  if (d.startsWith("00")) d = d.slice(2); // 00xx -> xx
  return d;
}

// Helper: شيل صفر المحلي لو موجود
function stripLocalZero(d) {
  return d.startsWith("0") ? d.slice(1) : d;
}

// Helper: الصق CC على رقم محلي
function attachCC(cc, digits) {
  return `${cc}${stripLocalZero(digits)}`;
}

// هل الرقم يبدأ بأحد الأكواد المسموحة (بدون +)
export function isAllowedMsisdn(digits) {
  return ALLOWED_CC.some((cc) => digits.startsWith(cc));
}

// أقل/أكثر طولين E.164 (digits فقط بعد إضافة CC)
export function isValidE164Digits(digits) {
  return /^\d{6,15}$/.test(digits);
}

// يحاول استخراج CC موجود فعلاً
export function splitCountryCode(digits) {
  const cc = ALLOWED_CC.find((c) => digits.startsWith(c));
  if (cc) return { digits, cc, core: digits.slice(cc.length) };
  const core = digits.startsWith("0") ? digits.slice(1) : digits;
  return { digits, cc: null, core };
}

// التخمين: جرّب بادئات 3 أرقام بعد إزالة صفر محلي، ثم جرّب الأنماط لكل دولة حسب أولوية:
// DEFAULT_CC أولاً، ثم بقية ALLOWED_CC
export function guessCountryCode(digits) {
  // لو فيه CC مسموح موجود بالفعل
  const existing = ALLOWED_CC.find((c) => digits.startsWith(c));
  if (existing) return existing;

  const dNo0 = stripLocalZero(digits);
  const p3 = dNo0.slice(0, 3);

  if (PREFIX_TO_CC[p3]) {
    const cc = PREFIX_TO_CC[p3];
    if (cc && ALLOWED_CC.includes(cc)) return cc;
  }

  const ordered = [DEFAULT_CC, ...ALLOWED_CC.filter((c) => c !== DEFAULT_CC)];
  for (const cc of ordered) {
    const pats = LOCAL_PATTERNS[cc] || [];
    if (pats.some((rx) => rx.test(digits) || rx.test(dNo0))) {
      return cc;
    }
  }

  return null; // ماقدرناش نخمّن
}

// يولّد كل الصيغ المحتملة (للبحث في DB) — كما هي
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

// صياغة E.164 مع محاولة التخمين لكود الدولة
export function formatToE164(msisdn) {
  const digits = cleanDigits(msisdn);

  // حالة 1: الرقم بالفعل بصيغة CCdigits بدون +
  if (isAllowedMsisdn(digits)) {
    if (!isValidE164Digits(digits)) {
      throw new Error(`Invalid E.164 length (has CC): ${digits}`);
    }
    return `+${digits}`;
  }

  // حالة 2: محلي — حاول نخمن CC
  const guessed = guessCountryCode(digits);
  const candidate = attachCC(guessed || DEFAULT_CC, digits);

  if (!ALLOWED_CC.includes(guessed || DEFAULT_CC)) {
    throw new Error(
      `Country not allowed: ${guessed || DEFAULT_CC} (check ALLOWED_CC & DEFAULT_CC)`
    );
  }
  if (!isValidE164Digits(candidate)) {
    throw new Error(`Invalid E.164 length: ${candidate}`);
  }

  return `+${candidate}`;
}

// اختصار مناسب للإرسال
export function normalizePhone(msisdn) {
  const digits = cleanDigits(msisdn);
  const { core } = splitCountryCode(digits);
  return {
    raw: msisdn,
    noPlus: digits, // كما كانت
    e164: formatToE164(msisdn), // الآن بيجرّب يخمّن CC لو ناقص
    core: core || stripLocalZero(digits),
    local0: digits.startsWith("0")
      ? digits
      : `0${core || stripLocalZero(digits)}`,
  };
}
