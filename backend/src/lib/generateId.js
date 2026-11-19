export const generateNumericId = () => Math.floor(10000 + Math.random() * 90000);

const DYNAMIC_ID_ALPHABET = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";

export const generateDynamicCode = () => {
  let code = "";
  for (let i = 0; i < 8; i++) {
    code += DYNAMIC_ID_ALPHABET[Math.floor(Math.random() * DYNAMIC_ID_ALPHABET.length)];
  }
  return code;
};
export const generateUniqueId = async (Model) => {
  let id;
  let exists = true;
  while (exists) {
    id = generateNumericId();
    exists = await Model.findById(id);
  }
  return id;
};

export const generateUniqueDynamicId = async (Model) => {
  let id;
  let exists = true;
  while (exists) {
    id = generateDynamicCode();
    exists = await Model.findOne({ dynamicId: id });
  }
  return id;
};

const getPHTDateString = () =>
  new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Manila",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(new Date());

export const getDailyDynamicId = (seed) => {
  if (!seed) return null;
  const input = `${seed}:${getPHTDateString()}`;
  let hash = 2166136261;
  for (let i = 0; i < input.length; i++) {
    hash ^= input.charCodeAt(i);
    hash = Math.imul(hash, 16777619) >>> 0;
  }
  let code = "";
  let h = hash;
  for (let i = 0; i < 8; i++) {
    code += DYNAMIC_ID_ALPHABET[h % DYNAMIC_ID_ALPHABET.length];
    h = (Math.imul(h, 31) + i + 7) >>> 0;
  }
  return mixLettersAndDigits(code, h);
};

const LETTERS = "ABCDEFGHJKLMNPQRSTUVWXYZ";
const DIGITS = "23456789";

// About 1 in 10 random codes is all letters; force at least one letter and one
// digit, using the hash so the same student keeps the same code all day.
const mixLettersAndDigits = (code, h) => {
  const chars = code.split("");
  const digitAt = h % chars.length;
  const letterAt = (digitAt + 1 + ((h >>> 8) % (chars.length - 1))) % chars.length;
  if (!/[0-9]/.test(code)) chars[digitAt] = DIGITS[(h >>> 4) % DIGITS.length];
  if (!/[A-Z]/.test(chars.join(""))) chars[letterAt] = LETTERS[(h >>> 12) % LETTERS.length];
  return chars.join("");
};

