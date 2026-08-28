// Counselors can paste a Google Maps link instead of typing raw coordinates.
// This extracts { lat, lng } from the common Google Maps URL shapes, including
// shortened maps.app.goo.gl links (resolved by following the redirect).
// Returns { lat, lng } or null — failures must never block saving the resource.

// Google encodes a place's *exact* marker coordinate as !3dLAT!4dLNG inside the
// data parameter, which is more precise than the @lat,lng viewport center that
// appears when a link is copied while freely browsing (not on a saved place).
// Prefer the marker when present, then the viewport center, then ?q=lat,lng.
const COORD_PATTERNS = [
  /!3d(-?\d+(?:\.\d+)?)!4d(-?\d+(?:\.\d+)?)/,
  /@(-?\d+(?:\.\d+)?),(-?\d+(?:\.\d+)?)/,
  /[?&]q=(-?\d+(?:\.\d+)?),(-?\d+(?:\.\d+)?)/,
];

// Service area is the Philippines; reject coordinates that fall outside it so a
// misparsed or junk pin doesn't land in the wrong country/region.
const PH_BOUNDS = { minLat: 4.5, maxLat: 21.5, minLng: 114.0, maxLng: 127.0 };

const isGoogleMapsUrl = (input) => {
  if (typeof input !== "string") return false;
  const trimmed = input.trim().toLowerCase();
  if (!trimmed) return false;
  return /(^|\.)google\.(com|co\.\w+)|maps\.google|maps\.app\.goo\.gl|goo\.gl\/maps/.test(trimmed);
};

const validateCoords = (lat, lng) => {
  if (!Number.isFinite(lat) || !Number.isFinite(lng)) return null;
  if (lat < -90 || lat > 90 || lng < -180 || lng > 180) return null;
  if (lat < PH_BOUNDS.minLat || lat > PH_BOUNDS.maxLat || lng < PH_BOUNDS.minLng || lng > PH_BOUNDS.maxLng) {
    return null;
  }
  return { lat, lng };
};

const extractCoords = (text) => {
  for (const pattern of COORD_PATTERNS) {
    const match = text.match(pattern);
    if (!match) continue;
    const validated = validateCoords(Number.parseFloat(match[1]), Number.parseFloat(match[2]));
    if (validated) return validated;
  }
  return null;
};

export const parseGoogleMapsUrl = async (input) => {
  if (!isGoogleMapsUrl(input)) {
    // Allow a bare "lat,lng" string as a convenience.
    const bare = input && typeof input === "string" ? input.match(/^(-?\d+(?:\.\d+)?),\s*(-?\d+(?:\.\d+)?)$/) : null;
    if (bare) return validateCoords(Number.parseFloat(bare[1]), Number.parseFloat(bare[2]));
    return null;
  }

  // Already contains coordinates → no network needed.
  const direct = extractCoords(input);
  if (direct) return direct;

  // Short link → follow the redirect and parse the resolved URL.
  try {
    const res = await fetch(input.trim(), {
      redirect: "follow",
      headers: { "User-Agent": "ust-legazpi-mhss/1.0 (resource map link resolver)" },
      signal: AbortSignal.timeout(5000),
    });
    return extractCoords(res.url || "");
  } catch {
    return null;
  }
};
