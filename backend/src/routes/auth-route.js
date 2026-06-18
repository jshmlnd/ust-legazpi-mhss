import express from "express";
import { login, logout, register, registerCounselor, updateProfile} from "../controllers/auth.controller.js";
import { protectRoute } from "../middleware/auth.middleware.js";

const router = express.Router();

router.post("/login", login);
router.post("/logout", logout);
router.post("/register", register);
router.post("/register-counselor", registerCounselor);

router.put("/update-profile", protectRoute, updateProfile);

export default router;