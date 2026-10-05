import express from "express";

import {
  createTrainer,
  getTrainers,
  updateTrainer,
  deleteTrainer
} from "../controllers/trainerController.js";

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

router.get("/", authorize(...MANAGE_ROLES), getTrainers);

router.post("/", authorize(...MANAGE_ROLES), createTrainer);

router.put("/:id", authorize(...MANAGE_ROLES), updateTrainer);

router.delete(
  "/:id",
  authorize("SUPER_ADMIN", "OWNER", "GYM_ADMIN"),
  deleteTrainer
);

export default router;
