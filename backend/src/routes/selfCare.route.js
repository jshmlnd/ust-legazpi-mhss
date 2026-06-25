import express from "express";
import { protectRoute } from "../middleware/auth.middleware.js";
import {
  getModules, createModule,
  updateModule, deleteModule, reorderModules,
} from "../controllers/selfCare.controller.js";

const router = express.Router();

router.get("/", protectRoute, getModules);
router.post("/", protectRoute, createModule);
router.patch("/reorder", protectRoute, reorderModules);
router.patch("/:id", protectRoute, updateModule);
router.delete("/:id", protectRoute, deleteModule);

export default router;
