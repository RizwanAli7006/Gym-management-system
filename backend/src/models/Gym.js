import mongoose from "mongoose";

const gymSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },

    email: {
      type: String,
      trim: true,
      lowercase: true,
      default: "",
    },

    phone: {
      type: String,
      trim: true,
      default: "",
    },

    address: {
      type: String,
      trim: true,
      default: "",
    },

    owner: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    admin: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },

    logo: {
      type: String,
      default: "",
    },

    status: {
      type: String,
      enum: ["ACTIVE", "INACTIVE"],
      default: "ACTIVE",
    },

    // Owner-configurable gym settings.
    settings: {
      currency: { type: String, default: "PKR" },
      monthlyFee: { type: Number, default: 0, min: 0 },
      openingTime: { type: String, default: "06:00" },
      closingTime: { type: String, default: "23:00" },
      weeklyOff: { type: String, default: "Sunday" },
      allowFreeze: { type: Boolean, default: true },
    },
  },
  {
    timestamps: true,
  }
);

gymSchema.index({ owner: 1 });

const Gym = mongoose.model("Gym", gymSchema);

export default Gym;