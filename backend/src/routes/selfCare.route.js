import express from "express";
import { protectRoute, counselorOnly } from "../middleware/auth.middleware.js";
import {
  getModules, createModule,
  updateModule, deleteModule, reorderModules,
} from "../controllers/selfCare.controller.js";

const router = express.Router();

router.get("/", protectRoute, getModules);
router.post("/", counselorOnly, createModule);
router.patch("/reorder", counselorOnly, reorderModules);
router.patch("/:id", counselorOnly, updateModule);
router.delete("/:id", counselorOnly, deleteModule);

export default router;
