import express from "express";

import {
  getDashboard,
  getReports,
} from "../controllers/dashboardController.js";

import { protect } from "../middleware/authMiddleware.js";

const router = express.Router();

router.get("/", protect, getDashboard);

router.get("/reports", protect, getReports);

export default router;
