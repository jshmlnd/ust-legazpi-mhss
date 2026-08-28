import express from "express";
import { checkAuth, login, logout, register, registerCounselor, updateProfile, updatePassword, updateProfileDetails, setPin, verifyPin, setTwoFactor, verifyTwoFactor } from "../controllers/auth.controller.js";
import { protectRoute, adminOnly } from "../middleware/auth.middleware.js";

const router = express.Router();

router.post("/login", login);
router.post("/logout", logout);
router.post("/register", register);
router.post("/register-counselor", registerCounselor);

router.put("/profile", protectRoute, updateProfile);
router.put("/password", protectRoute, updatePassword);
router.put("/profile-details", protectRoute, updateProfileDetails);
router.post("/pin", protectRoute, setPin);
router.post("/pin/verify", protectRoute, verifyPin);
router.put("/2fa", protectRoute, setTwoFactor);
router.post("/2fa/verify", verifyTwoFactor);

router.get("/check", protectRoute, checkAuth);

export default router;