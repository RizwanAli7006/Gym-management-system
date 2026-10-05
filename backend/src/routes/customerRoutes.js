import express from "express";

import {
  createCustomer,
  getCustomers,
  getCustomer,
  updateCustomer,
  toggleCustomerStatus,
  deleteCustomer,
  getCustomerStats,
  payFee,
  getMe
} from "../controllers/customerController.js";

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

// Self-service: a logged-in customer reads their own profile.
router.get("/me", authorize("CUSTOMER"), getMe);

router.get("/stats", authorize(...MANAGE_ROLES), getCustomerStats);

router.get("/", authorize(...MANAGE_ROLES), getCustomers);

router.post("/", authorize(...MANAGE_ROLES), createCustomer);

router.get("/:id", authorize(...MANAGE_ROLES), getCustomer);

router.put("/:id", authorize(...MANAGE_ROLES), updateCustomer);

router.post("/:id/pay-fee", authorize(...MANAGE_ROLES), payFee);

router.patch(
  "/:id/status",
  authorize(...MANAGE_ROLES),
  toggleCustomerStatus
);

router.delete(
  "/:id",
  authorize("SUPER_ADMIN", "OWNER", "GYM_ADMIN"),
  deleteCustomer
);

export default router;
