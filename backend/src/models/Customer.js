import mongoose from "mongoose";

const customerSchema = new mongoose.Schema(
  {
    gymId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Gym",
      required: true,
      index: true
    },

    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null
    },

    memberId: {
      type: String,
      trim: true
    },

    name: {
      type: String,
      required: true,
      trim: true
    },

    email: {
      type: String,
      trim: true,
      lowercase: true,
      default: ""
    },

    phone: {
      type: String,
      required: true,
      trim: true
    },

    dateOfBirth: {
      type: Date,
      default: null
    },

    gender: {
      type: String,
      enum: ["MALE", "FEMALE", "OTHER"],
      default: "OTHER"
    },

    address: {
      type: String,
      trim: true,
      default: ""
    },

    emergencyContactName: {
      type: String,
      trim: true,
      default: ""
    },

    emergencyContactPhone: {
      type: String,
      trim: true,
      default: ""
    },

    membershipPlan: {
      type: String,
      trim: true,
      default: ""
    },

    membershipStartDate: {
      type: Date,
      default: null
    },

    membershipExpiryDate: {
      type: Date,
      default: null
    },

    membershipStatus: {
      type: String,
      enum: [
        "ACTIVE",
        "EXPIRING",
        "EXPIRED",
        "NONE"
      ],
      default: "NONE"
    },

    status: {
      type: String,
      enum: ["ACTIVE", "INACTIVE"],
      default: "ACTIVE"
    },

    notes: {
      type: String,
      trim: true,
      default: ""
    },

    profileImage: {
      type: String,
      default: ""
    },

    // Monthly fee tracking — applies to every member regardless of
    // whether they also hold a formal membership plan.
    monthlyFee: {
      type: Number,
      default: 0,
      min: 0
    },

    feeStatus: {
      type: String,
      enum: ["PAID", "DUE", "OVERDUE"],
      default: "DUE"
    },

    lastFeePaidDate: {
      type: Date,
      default: null
    },

    nextFeeDate: {
      type: Date,
      default: null
    }
  },
  {
    timestamps: true
  }
);

customerSchema.index({
  gymId: 1,
  name: 1
});

// memberId is a per-gym member number, unique only within its gym.
customerSchema.index(
  { gymId: 1, memberId: 1 },
  { unique: true, sparse: true }
);

customerSchema.index({
  gymId: 1,
  phone: 1
});

customerSchema.index({
  gymId: 1,
  email: 1
});

const Customer = mongoose.model("Customer", customerSchema);

export default Customer;
