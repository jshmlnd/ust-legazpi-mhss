import Resource from "../models/resource.model.js";

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
    const resource = new Resource({ ...req.body, order: count });
    await resource.save();
    res.status(201).json(resource);
  } catch (error) {
    console.error("Error in createResource:", error.message);
    res.status(500).json({ error: "Internal server error" });
  }
};

export const updateResource = async (req, res) => {
  try {
    const resource = await Resource.findByIdAndUpdate(req.params.id, req.body, { new: true });
    if (!resource) return res.status(404).json({ error: "Resource not found" });
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
