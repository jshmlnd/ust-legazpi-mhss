const NOMINATIM_SEARCH_URL = "https://nominatim.openstreetmap.org/search";

// Map pins require lat/lng; this resolves a Philippine address to coordinates
// via Nominatim when a counselor saves a resource without entering them.
// Returns { lat, lng } or null — failures must never block saving the resource.
export const geocodeAddress = async (address) => {
  const query = typeof address === "string" ? address.trim() : "";
  if (!query) return null;

  try {
    const params = new URLSearchParams({
      q: query,
      format: "json",
      limit: "1",
      countrycodes: "ph",
    });
    const res = await fetch(`${NOMINATIM_SEARCH_URL}?${params}`, {
      headers: {
        "User-Agent": "ust-legazpi-mhss/1.0 (resource map geocoding)",
        "Accept-Language": "en",
      },
      signal: AbortSignal.timeout(5000),
    });
    if (!res.ok) return null;

    const [hit] = await res.json();
    const lat = Number(hit?.lat);
    const lng = Number(hit?.lon);
    if (!Number.isFinite(lat) || !Number.isFinite(lng)) return null;
    return { lat, lng };
  } catch {
    return null;
  }
};
