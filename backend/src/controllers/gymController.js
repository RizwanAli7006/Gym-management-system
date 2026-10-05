import mongoose from "mongoose";
import Gym from "../models/Gym.js";
import User from "../models/User.js";
import Branch from "../models/Branch.js";
import Customer from "../models/Customer.js";
import { hashPassword } from "../utils/authUtils.js";

/**
 * Build the Gym query filter for the current user.
 *  SUPER_ADMIN -> {} (all gyms)
 *  OWNER       -> { owner: self }
 *  others      -> { _id: own gymId }
 */
const gymAccessFilter = (req) => {
  if (req.user.role === "SUPER_ADMIN") return {};
  if (req.user.role === "OWNER") return { owner: req.user._id };
  if (req.user.gymId) return { _id: req.user.gymId };
  return { _id: null };
};

const serializeGym = (gym) => ({
  id: gym._id,
  name: gym.name,
  email: gym.email,
  phone: gym.phone,
  address: gym.address,
  logo: gym.logo,
  owner: gym.owner,
  admin: gym.admin,
  status: gym.status,
  settings: gym.settings,
  createdAt: gym.createdAt,
});

/**
 * createGym — SUPER_ADMIN only.
 * Creates the Gym AND its OWNER user account in one step.
 */
export const createGym = async (req, res) => {
  try {
    const {
      name,
      email,
      phone,
      address,
      logo,
      ownerName,
      ownerEmail,
      ownerPhone,
      ownerPassword,
    } = req.body;

    if (!name || !name.trim()) {
      return res.status(400).json({
        success: false,
        message: "Gym name is required",
      });
    }

    if (!ownerName || !ownerName.trim()) {
      return res.status(400).json({
        success: false,
        message: "Owner name is required",
      });
    }

    if (!ownerEmail || !ownerEmail.trim()) {
      return res.status(400).json({
        success: false,
        message: "Owner email is required",
      });
    }

    if (!ownerPassword || ownerPassword.length < 6) {
      return res.status(400).json({
        success: false,
        message: "Owner password must be at least 6 characters",
      });
    }

    const normalizedOwnerEmail = ownerEmail.toLowerCase().trim();

    const existingOwner = await User.findOne({
      email: normalizedOwnerEmail,
    });

    if (existingOwner) {
      return res.status(400).json({
        success: false,
        message: "Owner email already registered",
      });
    }

    const hashedPassword = await hashPassword(ownerPassword);

    const gym = await Gym.create({
      name: name.trim(),
      email: email || "",
      phone: phone || "",
      address: address || "",
      logo: logo || "",
      // temporary placeholder; replaced right after owner is created
      owner: new mongoose.Types.ObjectId(),
      status: "ACTIVE",
    });

    try {
      const owner = await User.create({
        name: ownerName.trim(),
        email: normalizedOwnerEmail,
        phone: ownerPhone || "",
        password: hashedPassword,
        role: "OWNER",
        gymId: gym._id,
        isActive: true,
      });

      gym.owner = owner._id;
      await gym.save();

      return res.status(201).json({
        success: true,
        message: "Gym and Owner created successfully",
        gym: serializeGym(gym),
        owner: {
          id: owner._id,
          name: owner.name,
          email: owner.email,
          phone: owner.phone,
          role: owner.role,
          gymId: owner.gymId,
          isActive: owner.isActive,
        },
      });
    } catch (ownerError) {
      await Gym.findByIdAndDelete(gym._id);
      throw ownerError;
    }
  } catch (error) {
    console.error("Create Gym Error:", error);

    return res.status(500).json({
      success: false,
      message: "Gym and Owner creation failed",
      error: error.message,
    });
  }
};

/**
 * getGyms — role aware.
 * SUPER_ADMIN: all gyms. OWNER: own gyms. Each gym enriched with
 * branch + member counts.
 */
export const getGyms = async (req, res) => {
  try {
    const gyms = await Gym.find(gymAccessFilter(req))
      .populate("owner", "name email phone role isActive")
      .populate("admin", "name email phone role isActive")
      .sort({ createdAt: -1 })
      .lean();

    const gymIds = gyms.map((g) => g._id);

    const [branchCounts, memberCounts] = await Promise.all([
      Branch.aggregate([
        { $match: { gymId: { $in: gymIds } } },
        { $group: { _id: "$gymId", count: { $sum: 1 } } },
      ]),
      Customer.aggregate([
        { $match: { gymId: { $in: gymIds } } },
        { $group: { _id: "$gymId", count: { $sum: 1 } } },
      ]),
    ]);

    const branchMap = Object.fromEntries(
      branchCounts.map((b) => [b._id.toString(), b.count])
    );
    const memberMap = Object.fromEntries(
      memberCounts.map((m) => [m._id.toString(), m.count])
    );

    const enriched = gyms.map((g) => ({
      ...g,
      branchCount: branchMap[g._id.toString()] || 0,
      memberCount: memberMap[g._id.toString()] || 0,
    }));

    return res.status(200).json({
      success: true,
      count: enriched.length,
      gyms: enriched,
    });
  } catch (error) {
    console.error("Get Gyms Error:", error);

    return res.status(500).json({
      success: false,
      message: "Unable to fetch gyms",
    });
  }
};

export const getGym = async (req, res) => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid gym ID",
      });
    }

    const gym = await Gym.findOne({ _id: id, ...gymAccessFilter(req) })
      .populate("owner", "name email phone role isActive")
      .populate("admin", "name email phone role isActive");

    if (!gym) {
      return res.status(404).json({
        success: false,
        message: "Gym not found",
      });
    }

    return res.status(200).json({
      success: true,
      gym,
    });
  } catch (error) {
    console.error("Get Gym Error:", error);

    return res.status(500).json({
      success: false,
      message: "Unable to fetch gym",
    });
  }
};

export const updateGym = async (req, res) => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid gym ID",
      });
    }

    const { name, email, phone, address, logo, status, settings } = req.body;

    if (
      status !== undefined &&
      !["ACTIVE", "INACTIVE"].includes(status)
    ) {
      return res.status(400).json({
        success: false,
        message: "Invalid gym status",
      });
    }

    const gym = await Gym.findOne({ _id: id, ...gymAccessFilter(req) });

    if (!gym) {
      return res.status(404).json({
        success: false,
        message: "Gym not found",
      });
    }

    if (name !== undefined) {
      if (!name.trim()) {
        return res.status(400).json({
          success: false,
          message: "Gym name cannot be empty",
        });
      }
      gym.name = name.trim();
    }

    if (email !== undefined) gym.email = email;
    if (phone !== undefined) gym.phone = phone;
    if (address !== undefined) gym.address = address;
    if (logo !== undefined) gym.logo = logo;

    // only SUPER_ADMIN may change status
    if (status !== undefined && req.user.role === "SUPER_ADMIN") {
      gym.status = status;
    }

    // Owner-configurable gym settings. Merge the provided keys onto the
    // existing subdoc so partial updates don't wipe other settings.
    if (settings !== undefined && settings && typeof settings === "object") {
      const s = settings;

      if (s.currency !== undefined) {
        gym.settings.currency = String(s.currency).trim() || "PKR";
      }

      if (s.monthlyFee !== undefined) {
        const fee = Number(s.monthlyFee);
        if (!Number.isFinite(fee) || fee < 0) {
          return res.status(400).json({
            success: false,
            message: "Invalid monthly fee",
          });
        }
        gym.settings.monthlyFee = fee;
      }

      if (s.openingTime !== undefined) {
        gym.settings.openingTime = String(s.openingTime).trim();
      }

      if (s.closingTime !== undefined) {
        gym.settings.closingTime = String(s.closingTime).trim();
      }

      if (s.weeklyOff !== undefined) {
        gym.settings.weeklyOff = String(s.weeklyOff).trim();
      }

      if (s.allowFreeze !== undefined) {
        gym.settings.allowFreeze = Boolean(s.allowFreeze);
      }
    }

    await gym.save();

    return res.status(200).json({
      success: true,
      message: "Gym updated successfully",
      gym: serializeGym(gym),
    });
  } catch (error) {
    console.error("Update Gym Error:", error);

    return res.status(500).json({
      success: false,
      message: "Gym update failed",
    });
  }
};

/**
 * deleteGym — SUPER_ADMIN only (deactivates the gym + its owner/admin).
 */
export const deleteGym = async (req, res) => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid gym ID",
      });
    }

    const gym = await Gym.findById(id);

    if (!gym) {
      return res.status(404).json({
        success: false,
        message: "Gym not found",
      });
    }

    gym.status = "INACTIVE";
    await gym.save();

    const deactivateIds = [gym.owner, gym.admin].filter(Boolean);
    if (deactivateIds.length) {
      await User.updateMany(
        { _id: { $in: deactivateIds } },
        { isActive: false }
      );
    }

    return res.status(200).json({
      success: true,
      message: "Gym deactivated successfully",
    });
  } catch (error) {
    console.error("Delete Gym Error:", error);

    return res.status(500).json({
      success: false,
      message: "Gym deletion failed",
    });
  }
};
