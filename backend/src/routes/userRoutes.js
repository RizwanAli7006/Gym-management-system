import express from "express";

import {
  createUser,
  getUsers,
  getUser,
  updateUser,
  updateUserStatus,
  deleteUser,
} from "../controllers/userController.js";

import { protect } from "../middleware/authMiddleware.js";
import { authorize } from "../middleware/roleMiddleware.js";

const router = express.Router();

router.use(protect);

const MANAGE = authorize("SUPER_ADMIN", "OWNER", "GYM_ADMIN");

router.post("/", MANAGE, createUser);

router.get("/", MANAGE, getUsers);

router.get("/:id", MANAGE, getUser);

router.put("/:id", MANAGE, updateUser);

router.patch("/:id/status", MANAGE, updateUserStatus);

router.delete("/:id", MANAGE, deleteUser);

export default router;
