import Resource from "../models/resource.model.js";
import { geocodeAddress } from "../lib/geocode.js";
import { parseGoogleMapsUrl } from "../lib/parseGoogleMapsUrl.js";

const parseCoords = ({ lat, lng }) => {
  const latNum = Number.parseFloat(lat);
  const lngNum = Number.parseFloat(lng);
  if (Number.isFinite(latNum) && Number.isFinite(lngNum)) return { lat: latNum, lng: lngNum };
  return null;
};

export const getResources = async (req, res) => {
  try {
    const resources = await Resource.find().sort({ order: 1, createdAt: -1 });
    res.json(resources);
  } catch (error) {
    console.error("Error in getResources:", error.message);
    res.status(500).json({ error: "Internal server error" });
  }
};

export const createResource = async (req, res) => {
  try {
    const count = await Resource.countDocuments();
    const data = { ...req.body, order: count };
    delete data.lat;
    delete data.lng;
    const coords =
      parseCoords(req.body) ??
      (req.body.mapUrl ? await parseGoogleMapsUrl(req.body.mapUrl) : null) ??
      (await geocodeAddress(data.address));
    if (coords) Object.assign(data, coords);
    const resource = new Resource(data);
    await resource.save();
    res.status(201).json(resource);
  } catch (error) {
    console.error("Error in createResource:", error.message);
    res.status(500).json({ error: "Internal server error" });
  }
};

export const updateResource = async (req, res) => {
  try {
    const existing = await Resource.findById(req.params.id);
    if (!existing) return res.status(404).json({ error: "Resource not found" });

    const updates = { ...req.body };
    const coords = parseCoords(updates);
    const sentCoordFields = 'lat' in updates || 'lng' in updates;
    delete updates.lat;
    delete updates.lng;

    const address = typeof updates.address === "string" ? updates.address.trim() : "";
    const addressChanged = address !== "" && address !== existing.address;
    // Manually entered coordinates win; a Google Maps link is resolved next;
    // otherwise re-locate when the address changed so the pin doesn't stay on
    // the old location; otherwise empty coordinate fields mean the counselor
    // is removing the pin.
    const resolved =
      coords ??
      (updates.mapUrl ? await parseGoogleMapsUrl(updates.mapUrl) : null);

    if (resolved) {
      updates.lat = resolved.lat;
      updates.lng = resolved.lng;
    } else if (addressChanged) {
      const geocoded = await geocodeAddress(address);
      if (geocoded) {
        updates.lat = geocoded.lat;
        updates.lng = geocoded.lng;
      } else if (sentCoordFields) {
        updates.lat = null;
        updates.lng = null;
      }
    } else if (sentCoordFields) {
      updates.lat = null;
      updates.lng = null;
    }

    const resource = await Resource.findByIdAndUpdate(req.params.id, updates, { new: true, runValidators: true });
    res.json(resource);
  } catch (error) {
    console.error("Error in updateResource:", error.message);
    res.status(500).json({ error: "Internal server error" });
  }
};

export const deleteResource = async (req, res) => {
  try {
    await Resource.findByIdAndDelete(req.params.id);
    res.json({ message: "Resource deleted" });
  } catch (error) {
    console.error("Error in deleteResource:", error.message);
    res.status(500).json({ error: "Internal server error" });
  }
};

export const reorderResources = async (req, res) => {
  try {
    const { orderedIds } = req.body;
    for (let i = 0; i < orderedIds.length; i++) {
      await Resource.findByIdAndUpdate(orderedIds[i], { order: i });
    }
    const resources = await Resource.find().sort({ order: 1 });
    res.json(resources);
  } catch (error) {
    console.error("Error in reorderResources:", error.message);
    res.status(500).json({ error: "Internal server error" });
  }
};
