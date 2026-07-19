import express from "express";
import { RtcTokenBuilder, Role } from "agora-access-token";
import { protectRoute } from "../middleware/auth.middleware.js";

const router = express.Router();

const APP_ID = process.env.AGORA_APP_ID;
const APP_CERTIFICATE = process.env.AGORA_APP_CERTIFICATE;
const TOKEN_EXPIRATION = parseInt(process.env.TOKEN_EXPIRATION) || 3600;

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
            Role.PUBLISHER,
            privilegeExpire
        );

        res.status(200).json({ token, appId: APP_ID });
    } catch (error) {
        console.log("Error generating Agora token: ", error.message);
        res.status(500).json({ error: "Failed to generate token" });
    }
});

export default router;
