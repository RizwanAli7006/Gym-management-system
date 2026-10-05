import express from "express";

import {
  createSuperAdmin,
  register,
  login,
  logout,
  getMe,
  updateProfile,
  resetOwnerPassword,
} from "../controllers/authController.js";

import { protect } from "../middleware/authMiddleware.js";

const router = express.Router();

router.post("/create-superadmin", createSuperAdmin);

router.post("/register", register);

router.post("/login", login);

router.post("/logout", logout);

router.post("/reset-owner-password", resetOwnerPassword);

router.get("/me", protect, getMe);

router.put("/profile", protect, updateProfile);

export default router;
