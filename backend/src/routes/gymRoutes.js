import express from "express";

import {
    createGym,
    getGyms,
    getGym,
    updateGym,
    deleteGym
} from "../controllers/gymController.js";

import { protect } from "../middleware/authMiddleware.js";
import { authorize } from "../middleware/roleMiddleware.js";

const router = express.Router();

router.use(protect);

// Super Admin creates a gym together with its owner account.
router.post("/", authorize("SUPER_ADMIN"), createGym);

// Super Admin sees all gyms; Owner sees only their own.
router.get("/", authorize("SUPER_ADMIN", "OWNER"), getGyms);

router.get("/:id", authorize("SUPER_ADMIN", "OWNER", "GYM_ADMIN"), getGym);

router.put("/:id", authorize("SUPER_ADMIN", "OWNER"), updateGym);

router.delete("/:id", authorize("SUPER_ADMIN"), deleteGym);

export default router;
