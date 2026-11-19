import express from "express";
import { protectRoute } from "../middleware/auth.middleware.js";
import { getVapidPublicKey, saveSubscription, deleteSubscription } from "../controllers/push.controller.js";

const router = express.Router();

router.get("/key", protectRoute, getVapidPublicKey);
router.post("/subscribe", protectRoute, saveSubscription);
router.post("/unsubscribe", protectRoute, deleteSubscription);

export default router;
