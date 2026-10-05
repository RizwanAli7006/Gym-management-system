import express from "express";

import {
  createPayment,
  getPayments,
  getPaymentStats,
  deletePayment
} from "../controllers/paymentController.js";

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

router.get("/stats", authorize(...MANAGE_ROLES), getPaymentStats);

router.get("/", authorize(...MANAGE_ROLES), getPayments);

router.post("/", authorize(...MANAGE_ROLES), createPayment);

router.delete(
  "/:id",
  authorize("SUPER_ADMIN", "OWNER", "GYM_ADMIN"),
  deletePayment
);

export default router;
