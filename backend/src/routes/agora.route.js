import express from "express";
import { RtcTokenBuilder, RtcRole } from "agora-access-token";
import { protectRoute } from "../middleware/auth.middleware.js";

const router = express.Router();

const APP_ID = process.env.AGORA_APP_ID || "640ea68b8daa4e83ba2a92bfbc1fca75";
const APP_CERTIFICATE = process.env.AGORA_APP_CERTIFICATE || "0cc7abf15c374ed3a90827389c694930";
const TOKEN_EXPIRATION = 3600;

router.post("/token", protectRoute, (req, res) => {
    try {
        const { channelName, uid } = req.body;

        if (!channelName || !uid) {
            return res.status(400).json({ error: "channelName and uid are required" });
        }

        const currentTime = Math.floor(Date.now() / 1000);
        const privilegeExpire = currentTime + TOKEN_EXPIRATION;

        const token = RtcTokenBuilder.buildTokenWithUid(
            APP_ID,
            APP_CERTIFICATE,
            channelName,
            parseInt(uid),
            RtcRole.PUBLISHER,
            privilegeExpire
        );

        res.status(200).json({ token, appId: APP_ID });
    } catch (error) {
        console.log("Error generating Agora token: ", error.message);
        res.status(500).json({ error: "Failed to generate token" });
    }
});

export default router;
