import express from "express";

import {
  createBranch,
  getBranches,
  updateBranch,
  deleteBranch,
} from "../controllers/branchController.js";

import { protect } from "../middleware/authMiddleware.js";
import { authorize } from "../middleware/roleMiddleware.js";

const router = express.Router();

router.use(protect);

router.get(
  "/",
  authorize("SUPER_ADMIN", "OWNER", "GYM_ADMIN", "MANAGER", "STAFF"),
  getBranches
);

router.post("/", authorize("SUPER_ADMIN", "OWNER"), createBranch);

router.put("/:id", authorize("SUPER_ADMIN", "OWNER"), updateBranch);

router.delete("/:id", authorize("SUPER_ADMIN", "OWNER"), deleteBranch);

export default router;
