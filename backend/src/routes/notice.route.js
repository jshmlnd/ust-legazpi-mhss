import express from "express";
import { counselorOnly } from "../middleware/auth.middleware.js";
import { getNotice, updateNotice } from "../controllers/notice.controller.js";

const router = express.Router();

router.get("/", getNotice);
router.put("/", counselorOnly, updateNotice);

export default router;
