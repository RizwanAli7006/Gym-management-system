import mongoose from "mongoose";
import Payment from "../models/Payment.js";
import Customer from "../models/Customer.js";
import {
  resolveScope,
  scopeToFilter,
  resolveWriteGymId,
  inScope
} from "../utils/scope.js";

export const createPayment = async (req, res) => {
  try {
    const { customerId, planId, amount, method, status, note, branchId } =
      req.body;

    if (amount === undefined || Number(amount) < 0) {
      return res.status(400).json({
        success: false,
        message: "A valid amount is required"
      });
    }

    const scope = await resolveScope(req);
    const gymId = resolveWriteGymId(req, scope);

    if (!gymId || !mongoose.Types.ObjectId.isValid(gymId)) {
      return res.status(400).json({
        success: false,
        message: "A valid gym ID is required"
      });
    }

    // If a customer is attached, it must belong to the same gym.
    if (customerId) {
      if (!mongoose.Types.ObjectId.isValid(customerId)) {
        return res.status(400).json({
          success: false,
          message: "Invalid customer ID"
        });
      }
      const customer = await Customer.findById(customerId).select("gymId");
      if (!customer || customer.gymId.toString() !== gymId.toString()) {
        return res.status(400).json({
          success: false,
          message: "Customer does not belong to this gym"
        });
      }
    }

    const payment = await Payment.create({
      gymId,
      branchId: branchId || null,
      customerId: customerId || null,
      planId: planId || null,
      amount: Number(amount),
      method: method || "CASH",
      status: status || "PAID",
      note: note?.trim() || ""
    });

    return res.status(201).json({
      success: true,
      message: "Payment recorded successfully",
      payment
    });
  } catch (error) {
    console.error("Create Payment Error:", error);
    return res.status(500).json({
      success: false,
      message: "Payment creation failed",
      error: error.message
    });
  }
};

export const getPayments = async (req, res) => {
  try {
    const scope = await resolveScope(req);

    if (!scope.isSuper && !scope.gymIds.length) {
      return res.status(400).json({
        success: false,
        message: "No gym is associated with your account"
      });
    }

    const query = { ...scopeToFilter(scope) };

    if (
      req.query.status &&
      ["PAID", "PENDING", "FAILED", "REFUNDED"].includes(req.query.status)
    ) {
      query.status = req.query.status;
    }

    const page = Math.max(Number(req.query.page) || 1, 1);
    const limit = Math.min(Math.max(Number(req.query.limit) || 20, 1), 100);
    const skip = (page - 1) * limit;

    const [payments, total] = await Promise.all([
      Payment.find(query)
        .populate("customerId", "name memberId")
        .sort({ paidAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),
      Payment.countDocuments(query)
    ]);

    return res.status(200).json({
      success: true,
      count: payments.length,
      total,
      page,
      pages: Math.ceil(total / limit),
      payments
    });
  } catch (error) {
    console.error("Get Payments Error:", error);
    return res.status(500).json({
      success: false,
      message: "Unable to fetch payments",
      error: error.message
    });
  }
};

export const getPaymentStats = async (req, res) => {
  try {
    const scope = await resolveScope(req);

    if (!scope.isSuper && !scope.gymIds.length) {
      return res.status(400).json({
        success: false,
        message: "No gym is associated with your account"
      });
    }

    const match = { ...scopeToFilter(scope), status: "PAID" };

    const now = new Date();
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);

    const [totalAgg, monthAgg] = await Promise.all([
      Payment.aggregate([
        { $match: match },
        { $group: { _id: null, total: { $sum: "$amount" }, count: { $sum: 1 } } }
      ]),
      Payment.aggregate([
        { $match: { ...match, paidAt: { $gte: monthStart } } },
        { $group: { _id: null, total: { $sum: "$amount" } } }
      ])
    ]);

    return res.status(200).json({
      success: true,
      stats: {
        totalRevenue: totalAgg.length ? totalAgg[0].total : 0,
        totalPayments: totalAgg.length ? totalAgg[0].count : 0,
        monthRevenue: monthAgg.length ? monthAgg[0].total : 0
      }
    });
  } catch (error) {
    console.error("Get Payment Stats Error:", error);
    return res.status(500).json({
      success: false,
      message: "Unable to fetch payment statistics",
      error: error.message
    });
  }
};

export const deletePayment = async (req, res) => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid payment ID"
      });
    }

    const scope = await resolveScope(req);
    const payment = await Payment.findById(id);

    if (!payment || !inScope(scope, payment.gymId)) {
      return res.status(404).json({
        success: false,
        message: "Payment not found"
      });
    }

    await Payment.findByIdAndDelete(id);

    return res.status(200).json({
      success: true,
      message: "Payment deleted successfully"
    });
  } catch (error) {
    console.error("Delete Payment Error:", error);
    return res.status(500).json({
      success: false,
      message: "Payment deletion failed",
      error: error.message
    });
  }
};
