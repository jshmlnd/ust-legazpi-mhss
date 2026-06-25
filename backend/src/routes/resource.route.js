import express from "express";
import { protectRoute } from "../middleware/auth.middleware.js";
import {
  getResources, createResource,
  updateResource, deleteResource, reorderResources,
} from "../controllers/resource.controller.js";

const router = express.Router();

router.get("/", protectRoute, getResources);
router.post("/", protectRoute, createResource);
router.patch("/reorder", protectRoute, reorderResources);
router.patch("/:id", protectRoute, updateResource);
router.delete("/:id", protectRoute, deleteResource);

export default router;
