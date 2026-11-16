import express from "express";
import { protectRoute, counselorOnly } from "../middleware/auth.middleware.js";
import {
  getResources, createResource,
  updateResource, deleteResource, reorderResources,
} from "../controllers/resource.controller.js";

const router = express.Router();

router.get("/", protectRoute, getResources);
router.post("/", counselorOnly, createResource);
router.patch("/reorder", counselorOnly, reorderResources);
router.patch("/:id", counselorOnly, updateResource);
router.delete("/:id", counselorOnly, deleteResource);

export default router;
