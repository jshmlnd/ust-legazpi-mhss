import express from "express";
import { getUsers, getCounselors, updateUser, updateCounselor, deleteUser, deleteCounselor } from "../controllers/admin.controller.js";
import { adminOnly } from "../middleware/auth.middleware.js";

const router = express.Router();

router.use(adminOnly);

router.get("/users", getUsers);
router.get("/counselors", getCounselors);
router.put("/users/:id", updateUser);
router.put("/counselors/:id", updateCounselor);
router.delete("/users/:id", deleteUser);
router.delete("/counselors/:id", deleteCounselor);

export default router;
