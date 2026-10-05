import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import cookieParser from "cookie-parser";
import path from "path";
import { fileURLToPath } from "url";

import connectDB from "./src/config/db.js";

import authRoutes from "./src/routes/authRoutes.js";
import branchRoutes from "./src/routes/branchRoutes.js";
import gymRoutes from "./src/routes/gymRoutes.js";
import userRoutes from "./src/routes/userRoutes.js";
import gymAdminRoutes from "./src/routes/gymAdminRoutes.js";
import dashboardRoutes from "./src/routes/dashboardRoutes.js";
import customerRoutes from "./src/routes/customerRoutes.js";
import trainerRoutes from "./src/routes/trainerRoutes.js";
import membershipRoutes from "./src/routes/membershipRoutes.js";
import paymentRoutes from "./src/routes/paymentRoutes.js";
import attendanceRoutes from "./src/routes/attendanceRoutes.js";

dotenv.config();

const app = express();

const PORT = process.env.PORT || 5000;

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

app.use(
  cors({
    origin: process.env.CLIENT_URL || "http://localhost:5173",
    credentials: true,
  })
);

app.use(express.json());

app.use(
  express.urlencoded({
    extended: true,
  })
);

app.use(cookieParser());

app.get("/api/health", (req, res) => {
  res.status(200).json({
    success: true,
    message: "Gym Management System API is running",
  });
});

app.use("/api/auth", authRoutes);

app.use("/api/branches", branchRoutes);

app.use("/api/gyms", gymRoutes);

app.use("/api/users", userRoutes);

app.use("/api/gym-admins", gymAdminRoutes);

app.use("/api/dashboard", dashboardRoutes);

app.use("/api/customers", customerRoutes);

app.use("/api/trainers", trainerRoutes);

app.use("/api/plans", membershipRoutes);

app.use("/api/payments", paymentRoutes);

app.use("/api/attendance", attendanceRoutes);

const frontendPath = path.join(__dirname, "frontend", "dist");

app.use(express.static(frontendPath));

app.use((req, res, next) => {
  if (req.path.startsWith("/api/")) {
    return res.status(404).json({
      success: false,
      message: "API route not found",
    });
  }

  res.sendFile(path.join(frontendPath, "index.html"));
});

app.use((error, req, res, next) => {
  console.error("Unhandled error:", error);

  res.status(500).json({
    success: false,
    message: "Internal server error",
  });
});

const startServer = async () => {
  try {
    await connectDB();

    app.listen(PORT, () => {
      console.log("=================================");
      console.log("MongoDB connected successfully");
      console.log(
        `Gym Management System running on http://localhost:${PORT}`
      );
      console.log(
        `Health Check: http://localhost:${PORT}/api/health`
      );
      console.log("Frontend build:", frontendPath);
      console.log("=================================");
    });
  } catch (error) {
    console.error("Server startup error:", error.message);
    process.exit(1);
  }
};

startServer();