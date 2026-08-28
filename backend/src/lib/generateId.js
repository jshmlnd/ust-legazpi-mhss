const generateNumericId = () => Math.floor(10000 + Math.random() * 90000);

const DYNAMIC_ID_ALPHABET = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";

const generateDynamicCode = () => {
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

const DYNAMIC_ID_HASH_ALPHABET = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";

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
    code += DYNAMIC_ID_HASH_ALPHABET[h % DYNAMIC_ID_HASH_ALPHABET.length];
    h = (Math.imul(h, 31) + i + 7) >>> 0;
  }
  return code;
};

export const toPublicUser = (user) => {
  const obj = user && typeof user.toObject === "function" ? user.toObject() : { ...(user || {}) };
  if (obj.dynamicId) obj.dynamicId = getDailyDynamicId(obj.dynamicId);
  return obj;
};
