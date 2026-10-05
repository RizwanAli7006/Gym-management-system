import mongoose from "mongoose";

const attendanceSchema = new mongoose.Schema(
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
      required: true,
    },

    checkIn: {
      type: Date,
      default: Date.now,
    },

    checkOut: {
      type: Date,
      default: null,
    },

    date: {
      type: String, // YYYY-MM-DD for easy day grouping
      required: true,
      index: true,
    },
  },
  {
    timestamps: true,
  }
);

attendanceSchema.index({ gymId: 1, date: -1 });
attendanceSchema.index({ customerId: 1, date: -1 });

const Attendance = mongoose.model("Attendance", attendanceSchema);

export default Attendance;
