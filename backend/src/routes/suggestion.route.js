import express from "express";
import { protectRoute } from "../middleware/auth.middleware.js";
import {
  getSuggestions, createSuggestion, deleteSuggestion,
} from "../controllers/suggestion.controller.js";

const router = express.Router();

router.get("/", protectRoute, getSuggestions);
router.post("/", protectRoute, createSuggestion);
router.delete("/:id", protectRoute, deleteSuggestion);

export default router;
