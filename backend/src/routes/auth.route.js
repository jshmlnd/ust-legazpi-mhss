import express from "express";
import { checkAuth, login, logout, register, registerCounselor, updateProfile, updatePassword, updateProfileDetails } from "../controllers/auth.controller.js";
import { protectRoute, adminOnly } from "../middleware/auth.middleware.js";

const router = express.Router();

router.post("/login", login);
router.post("/logout", logout);
router.post("/register", adminOnly, register);
router.post("/register-counselor", adminOnly, registerCounselor);

router.put("/profile", protectRoute, updateProfile);
router.put("/password", protectRoute, updatePassword);
router.put("/profile-details", protectRoute, updateProfileDetails);

router.get("/check", protectRoute, checkAuth);

export default router;