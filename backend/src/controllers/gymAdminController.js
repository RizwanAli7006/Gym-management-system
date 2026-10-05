import mongoose from "mongoose";
import User from "../models/User.js";
import Gym from "../models/Gym.js";
import { hashPassword } from "../utils/authUtils.js";

// Confirm the acting user is allowed to manage the given gym.
// SUPER_ADMIN may touch any gym; an OWNER only gyms they own.
const canManageGym = (req, gym) => {
  if (!gym) return false;
  if (req.user.role === "SUPER_ADMIN") return true;
  if (req.user.role === "OWNER") {
    return gym.owner?.toString() === req.user._id.toString();
  }
  return false;
};

const serializeAdmin = (user) => ({
  id: user._id,
  name: user.name,
  email: user.email,
  phone: user.phone,
  role: user.role,
  gymId: user.gymId,
  isActive: user.isActive,
  profileImage: user.profileImage,
  createdAt: user.createdAt
});

// Create a GYM_ADMIN for one of the owner's gyms and link it as that
// gym's admin. Owners use this to delegate day-to-day gym management.
export const createGymAdmin = async (req, res) => {
  try {
    if (!["SUPER_ADMIN", "OWNER"].includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        message: "You do not have permission to create gym admins"
      });
    }

    const { name, email, phone, password, gymId } = req.body;

    if (!name || !name.trim()) {
      return res.status(400).json({
        success: false,
        message: "Admin name is required"
      });
    }

    if (!email || !email.trim()) {
      return res.status(400).json({
        success: false,
        message: "Admin email is required"
      });
    }

    if (!password || password.length < 6) {
      return res.status(400).json({
        success: false,
        message: "Password must be at least 6 characters"
      });
    }

    if (!gymId || !mongoose.Types.ObjectId.isValid(gymId)) {
      return res.status(400).json({
        success: false,
        message: "A valid gym ID is required"
      });
    }

    const gym = await Gym.findById(gymId);

    if (!gym || !canManageGym(req, gym)) {
      return res.status(404).json({
        success: false,
        message: "Gym not found"
      });
    }

    const normalizedEmail = email.toLowerCase().trim();

    const existingUser = await User.findOne({ email: normalizedEmail });

    if (existingUser) {
      return res.status(400).json({
        success: false,
        message: "Email already registered"
      });
    }

    const hashedPassword = await hashPassword(password);

    const admin = await User.create({
      name: name.trim(),
      email: normalizedEmail,
      phone: phone || "",
      password: hashedPassword,
      role: "GYM_ADMIN",
      gymId: gym._id,
      isActive: true
    });

    // Link as the gym's primary admin.
    gym.admin = admin._id;
    await gym.save();

    return res.status(201).json({
      success: true,
      message: "Gym admin created successfully",
      admin: serializeAdmin(admin)
    });
  } catch (error) {
    console.error("Create Gym Admin Error:", error);

    return res.status(500).json({
      success: false,
      message: "Gym admin creation failed",
      error: error.message
    });
  }
};

// List GYM_ADMIN accounts within the caller's scope.
export const getGymAdmins = async (req, res) => {
  try {
    if (!["SUPER_ADMIN", "OWNER"].includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        message: "You do not have permission to view gym admins"
      });
    }

    const filter = { role: "GYM_ADMIN" };

    if (req.user.role === "OWNER") {
      const gyms = await Gym.find({ owner: req.user._id })
        .select("_id")
        .lean();
      filter.gymId = { $in: gyms.map((g) => g._id) };
    } else if (req.query.gymId) {
      if (!mongoose.Types.ObjectId.isValid(req.query.gymId)) {
        return res.status(400).json({
          success: false,
          message: "Invalid gym ID"
        });
      }
      filter.gymId = req.query.gymId;
    }

    const admins = await User.find(filter)
      .select("-password")
      .populate("gymId", "name")
      .sort({ createdAt: -1 });

    return res.status(200).json({
      success: true,
      count: admins.length,
      admins
    });
  } catch (error) {
    console.error("Get Gym Admins Error:", error);

    return res.status(500).json({
      success: false,
      message: "Unable to fetch gym admins",
      error: error.message
    });
  }
};

// Activate / deactivate a gym admin the caller is allowed to manage.
export const setGymAdminActive = async (req, res) => {
  try {
    if (!["SUPER_ADMIN", "OWNER"].includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        message: "You do not have permission to update gym admins"
      });
    }

    const { id } = req.params;
    const { isActive } = req.body;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid admin ID"
      });
    }

    if (typeof isActive !== "boolean") {
      return res.status(400).json({
        success: false,
        message: "isActive must be true or false"
      });
    }

    const admin = await User.findOne({ _id: id, role: "GYM_ADMIN" });

    if (!admin) {
      return res.status(404).json({
        success: false,
        message: "Gym admin not found"
      });
    }

    const gym = await Gym.findById(admin.gymId);

    if (!canManageGym(req, gym)) {
      return res.status(404).json({
        success: false,
        message: "Gym admin not found"
      });
    }

    admin.isActive = isActive;
    await admin.save();

    return res.status(200).json({
      success: true,
      message: isActive
        ? "Gym admin activated successfully"
        : "Gym admin deactivated successfully",
      admin: serializeAdmin(admin)
    });
  } catch (error) {
    console.error("Set Gym Admin Active Error:", error);

    return res.status(500).json({
      success: false,
      message: "Unable to update gym admin",
      error: error.message
    });
  }
};
