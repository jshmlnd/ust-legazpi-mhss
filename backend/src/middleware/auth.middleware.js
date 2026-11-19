import crypto from "node:crypto";
import jwt from "jsonwebtoken";
import mongoose from "mongoose";
import User from "../models/user.model.js";
import Counselor from "../models/counselor.model.js";
import { generateUniqueDynamicId } from "../lib/generateId.js";

export const protectRoute = async (req, res, next) => {
    try {
        // ponytail: fail fast with 503 when DB is down — queued requests would
        // otherwise buffer up to the 10s server timeout each, piling up while
        // Mongo reconnects and making recovery slower. Clients get an
        // unambiguous retryable status instead of a hang.
        if (mongoose.connection.readyState !== 1) {
            return res.status(503).json({ message: "Service unavailable - database not connected" });
        }
        const token = req.cookies.jwt;

        if (!token) {
            return res.status(401).json({ message: "Unauthorized - No token provided" });
        }

        const decoded = jwt.verify(token, process.env.JWT_SECRET);

        if (!decoded) {
            return res.status(401).json({ message: "Unauthorized - Invalid Token" });
        }

        let user = await User.findById(decoded.userId).select("-password");

        if (!user) {
            user = await Counselor.findById(decoded.userId).select("-password");
        } else if (!user.dynamicId) {
            user.dynamicId = await generateUniqueDynamicId(User);
            await user.save();
        }

        if (!user) {
            return res.status(404).json({ message: "User not found" });
        }

        req.user = user

        next()
    } catch (error) {
        console.log("Error in protectRoute middleware: ", error.message);
        return res.status(500).json({ message: "Internal server error" });
    }
};

export const counselorOnly = async (req, res, next) => {
    await protectRoute(req, res, () => {
        if (!req.user || req.user.userType?.toLowerCase() !== 'counselor') {
            return res.status(403).json({ message: "Forbidden - Counselor access only" });
        }
        next();
    });
};

// Account creation has no in-app role: it is called from Postman with the
// ACCOUNT_PROVISION_KEY from .env in the x-provision-key header.
export const provisionKeyOnly = (req, res, next) => {
    const expected = process.env.ACCOUNT_PROVISION_KEY;
    if (!expected) {
        return res.status(503).json({ message: "Account provisioning is disabled - ACCOUNT_PROVISION_KEY is not set" });
    }
    const a = crypto.createHash("sha256").update(String(req.get("x-provision-key") || "")).digest();
    const b = crypto.createHash("sha256").update(expected).digest();
    if (!crypto.timingSafeEqual(a, b)) {
        return res.status(403).json({ message: "Forbidden - invalid provisioning key" });
    }
    next();
};
