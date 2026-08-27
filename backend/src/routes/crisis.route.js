import express from "express";
import { protectRoute } from "../middleware/auth.middleware.js";
import { analyze } from "../controllers/crisis.controller.js";

const router = express.Router();

router.post("/analyze", protectRoute, analyze);

export default router;
