import mongoose from "mongoose";

const paymentSchema = new mongoose.Schema(
  {
    gymId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Gym",
      required: true,
      index: true,
    },

    branchId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Branch",
      default: null,
    },

    customerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Customer",
      default: null,
    },

    planId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "MembershipPlan",
      default: null,
    },

    amount: {
      type: Number,
      required: true,
      min: 0,
    },

    method: {
      type: String,
      enum: ["CASH", "CARD", "BANK", "ONLINE", "OTHER"],
      default: "CASH",
    },

    status: {
      type: String,
      enum: ["PAID", "PENDING", "FAILED", "REFUNDED"],
      default: "PAID",
    },

    note: {
      type: String,
      trim: true,
      default: "",
    },

    paidAt: {
      type: Date,
      default: Date.now,
    },
  },
  {
    timestamps: true,
  }
);

paymentSchema.index({ gymId: 1, paidAt: -1 });

const Payment = mongoose.model("Payment", paymentSchema);

export default Payment;
