import express from "express";

import {
  createGymAdmin,
  getGymAdmins,
  setGymAdminActive
} from "../controllers/gymAdminController.js";

import { protect } from "../middleware/authMiddleware.js";
import { authorize } from "../middleware/roleMiddleware.js";

const router = express.Router();

router.use(protect);

router.get("/", authorize("SUPER_ADMIN", "OWNER"), getGymAdmins);

router.post("/", authorize("SUPER_ADMIN", "OWNER"), createGymAdmin);

router.patch(
  "/:id/status",
  authorize("SUPER_ADMIN", "OWNER"),
  setGymAdminActive
);

export default router;
