import mongoose from "mongoose";
import Attendance from "../models/Attendance.js";
import Customer from "../models/Customer.js";
import {
  resolveScope,
  scopeToFilter,
  resolveWriteGymId,
  inScope
} from "../utils/scope.js";

const todayKey = () => new Date().toISOString().slice(0, 10);

// Record a member check-in.
export const checkIn = async (req, res) => {
  try {
    const { customerId, branchId } = req.body;

    if (!customerId || !mongoose.Types.ObjectId.isValid(customerId)) {
      return res.status(400).json({
        success: false,
        message: "A valid customer ID is required"
      });
    }

    const scope = await resolveScope(req);
    const customer = await Customer.findById(customerId).select("gymId");

    if (!customer || !inScope(scope, customer.gymId)) {
      return res.status(404).json({
        success: false,
        message: "Customer not found"
      });
    }

    // Prefer the write gym when provided, else the customer's own gym.
    const writeGymId = resolveWriteGymId(req, scope);
    const gymId =
      writeGymId && writeGymId.toString() === customer.gymId.toString()
        ? writeGymId
        : customer.gymId;

    const attendance = await Attendance.create({
      gymId,
      branchId: branchId || null,
      customerId,
      checkIn: new Date(),
      date: todayKey()
    });

    return res.status(201).json({
      success: true,
      message: "Check-in recorded",
      attendance
    });
  } catch (error) {
    console.error("Check-in Error:", error);
    return res.status(500).json({
      success: false,
      message: "Check-in failed",
      error: error.message
    });
  }
};

// Close out an open attendance record.
export const checkOut = async (req, res) => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid attendance ID"
      });
    }

    const scope = await resolveScope(req);
    const attendance = await Attendance.findById(id);

    if (!attendance || !inScope(scope, attendance.gymId)) {
      return res.status(404).json({
        success: false,
        message: "Attendance record not found"
      });
    }

    attendance.checkOut = new Date();
    await attendance.save();

    return res.status(200).json({
      success: true,
      message: "Check-out recorded",
      attendance
    });
  } catch (error) {
    console.error("Check-out Error:", error);
    return res.status(500).json({
      success: false,
      message: "Check-out failed",
      error: error.message
    });
  }
};

export const getAttendance = async (req, res) => {
  try {
    const scope = await resolveScope(req);

    if (!scope.isSuper && !scope.gymIds.length) {
      return res.status(400).json({
        success: false,
        message: "No gym is associated with your account"
      });
    }

    const query = { ...scopeToFilter(scope) };

    if (req.query.date) query.date = req.query.date;
    if (req.query.customerId &&
      mongoose.Types.ObjectId.isValid(req.query.customerId)) {
      query.customerId = req.query.customerId;
    }

    const records = await Attendance.find(query)
      .populate("customerId", "name memberId")
      .sort({ checkIn: -1 })
      .limit(200)
      .lean();

    return res.status(200).json({
      success: true,
      count: records.length,
      attendance: records
    });
  } catch (error) {
    console.error("Get Attendance Error:", error);
    return res.status(500).json({
      success: false,
      message: "Unable to fetch attendance",
      error: error.message
    });
  }
};
