import jwt from "jsonwebtoken";
import User from "../models/user.model.js";
import Counselor from "../models/counselor.model.js";
import { generateUniqueDynamicId } from "../lib/generateId.js";

export const protectRoute = async (req, res, next) => {
    try {
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

export const adminOnly = async (req, res, next) => {
    await protectRoute(req, res, () => {
        if (!req.user || req.user.userType?.toLowerCase() !== 'administrator') {
            return res.status(403).json({ message: "Forbidden - Administrator access only" });
        }
        next();
    });
};

export const counselorOnly = async (req, res, next) => {
    await protectRoute(req, res, () => {
        if (!req.user || req.user.userType?.toLowerCase() !== 'counselor') {
            return res.status(403).json({ message: "Forbidden - Counselor access only" });
        }
        next();
    });
};