import express from "express";
import { checkAuth, login, logout, register, registerCounselor, updateProfile, updatePassword, sendOTP, verifyOTP, disable2FA, updateProfileDetails } from "../controllers/auth.controller.js";
import { protectRoute } from "../middleware/auth.middleware.js";

const router = express.Router();

router.post("/login", login);
router.post("/logout", logout);
router.post("/register", register);
router.post("/register-counselor", registerCounselor);

router.put("/profile", protectRoute, updateProfile);
router.put("/password", protectRoute, updatePassword);
router.put("/profile-details", protectRoute, updateProfileDetails);

router.post("/send-otp", protectRoute, sendOTP);
router.post("/verify-otp", protectRoute, verifyOTP);
router.post("/disable-2fa", protectRoute, disable2FA);

router.get("/check", protectRoute, checkAuth);

export default router;