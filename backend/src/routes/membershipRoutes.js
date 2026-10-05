import express from "express";

import {
  createPlan,
  getPlans,
  updatePlan,
  deletePlan
} from "../controllers/membershipController.js";

import { protect } from "../middleware/authMiddleware.js";
import { authorize } from "../middleware/roleMiddleware.js";

const router = express.Router();

router.use(protect);

const MANAGE_ROLES = [
  "SUPER_ADMIN",
  "OWNER",
  "GYM_ADMIN",
  "MANAGER",
  "STAFF"
];

router.get("/", authorize(...MANAGE_ROLES), getPlans);

router.post("/", authorize("SUPER_ADMIN", "OWNER", "GYM_ADMIN"), createPlan);

router.put("/:id", authorize("SUPER_ADMIN", "OWNER", "GYM_ADMIN"), updatePlan);

router.delete(
  "/:id",
  authorize("SUPER_ADMIN", "OWNER", "GYM_ADMIN"),
  deletePlan
);

export default router;
