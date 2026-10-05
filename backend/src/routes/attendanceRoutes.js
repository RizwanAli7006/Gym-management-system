import express from "express";

import {
  checkIn,
  checkOut,
  getAttendance
} from "../controllers/attendanceController.js";

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

router.get("/", authorize(...MANAGE_ROLES), getAttendance);

router.post("/check-in", authorize(...MANAGE_ROLES), checkIn);

router.patch("/:id/check-out", authorize(...MANAGE_ROLES), checkOut);

export default router;
