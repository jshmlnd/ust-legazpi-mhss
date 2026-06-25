import SelfCareModule from "../models/selfCareModule.model.js";

export const getModules = async (req, res) => {
  try {
    const modules = await SelfCareModule.find().sort({ order: 1 });
    res.json(modules);
  } catch (error) {
    console.error("Error in getModules:", error.message);
    res.status(500).json({ error: "Internal server error" });
  }
};

export const createModule = async (req, res) => {
  try {
    const count = await SelfCareModule.countDocuments();
    const mod = new SelfCareModule({ ...req.body, order: count, createdBy: req.user._id });
    await mod.save();
    res.status(201).json(mod);
  } catch (error) {
    console.error("Error in createModule:", error.message);
    res.status(500).json({ error: "Internal server error" });
  }
};

export const updateModule = async (req, res) => {
  try {
    const mod = await SelfCareModule.findByIdAndUpdate(req.params.id, req.body, { new: true });
    if (!mod) return res.status(404).json({ error: "Module not found" });
    res.json(mod);
  } catch (error) {
    console.error("Error in updateModule:", error.message);
    res.status(500).json({ error: "Internal server error" });
  }
};

export const deleteModule = async (req, res) => {
  try {
    await SelfCareModule.findByIdAndDelete(req.params.id);
    res.json({ message: "Module deleted" });
  } catch (error) {
    console.error("Error in deleteModule:", error.message);
    res.status(500).json({ error: "Internal server error" });
  }
};

export const reorderModules = async (req, res) => {
  try {
    const { orderedIds } = req.body;
    for (let i = 0; i < orderedIds.length; i++) {
      await SelfCareModule.findByIdAndUpdate(orderedIds[i], { order: i });
    }
    const modules = await SelfCareModule.find().sort({ order: 1 });
    res.json(modules);
  } catch (error) {
    console.error("Error in reorderModules:", error.message);
    res.status(500).json({ error: "Internal server error" });
  }
};
