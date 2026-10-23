import express from "express";
import { checkAuth, login, logout, register, registerCounselor, updateProfile, updatePassword, updateProfileDetails, setPin, verifyPin, removePin, verifyTwoFactor, totpSetup, totpVerify, totpDisable } from "../controllers/auth.controller.js";
import { forgotPassword, resetPassword, verifyResetCode } from "../controllers/passwordReset.controller.js";
import { verifyEmail, resendVerification } from "../controllers/emailVerification.controller.js";
import { protectRoute, adminOnly } from "../middleware/auth.middleware.js";

const router = express.Router();

router.post("/login", login);
router.post("/forgot-password", forgotPassword);
router.post("/reset-password", resetPassword);
router.post("/verify-reset-code", verifyResetCode);
router.get("/verify-email", verifyEmail);
router.post("/resend-verification", resendVerification);
router.post("/logout", logout);
router.post("/register", adminOnly, register);
router.post("/register-counselor", adminOnly, registerCounselor);

router.put("/profile", protectRoute, updateProfile);
router.put("/password", protectRoute, updatePassword);
router.put("/profile-details", protectRoute, updateProfileDetails);
router.post("/pin", protectRoute, setPin);
router.post("/pin/verify", protectRoute, verifyPin);
router.delete("/pin", protectRoute, removePin);
router.put("/2fa", protectRoute, totpDisable);
router.post("/2fa/setup", protectRoute, totpSetup);
router.post("/2fa/verify", verifyTwoFactor);
router.post("/2fa/confirm", protectRoute, totpVerify);

router.get("/check", protectRoute, checkAuth);

export default router;
