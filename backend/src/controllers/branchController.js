import mongoose from "mongoose";
import Branch from "../models/Branch.js";
import Gym from "../models/Gym.js";
import Customer from "../models/Customer.js";

/**
 * Resolve the set of gymIds the current user may touch, and (for a given
 * gymId) confirm the user is allowed to act on it.
 * Returns { allowed: Boolean, gymIds: [ObjectId] }.
 */
const resolveGymScope = async (req) => {
  if (req.user.role === "SUPER_ADMIN") {
    const gyms = await Gym.find().select("_id").lean();
    return { gymIds: gyms.map((g) => g._id), isSuper: true };
  }

  if (req.user.role === "OWNER") {
    const gyms = await Gym.find({ owner: req.user._id })
      .select("_id")
      .lean();
    return { gymIds: gyms.map((g) => g._id), isSuper: false };
  }

  // GYM_ADMIN / staff
  if (req.user.gymId) {
    return { gymIds: [req.user.gymId], isSuper: false };
  }

  return { gymIds: [], isSuper: false };
};

const ownsGym = (gymIds, gymId) =>
  gymIds.some((id) => id.toString() === gymId.toString());

export const createBranch = async (req, res) => {
  try {
    const { gymId, name, email, phone, address } = req.body;

    if (!name || !name.trim()) {
      return res.status(400).json({
        success: false,
        message: "Branch name is required",
      });
    }

    const targetGymId = gymId || req.user.gymId;

    if (!targetGymId || !mongoose.Types.ObjectId.isValid(targetGymId)) {
      return res.status(400).json({
        success: false,
        message: "A valid gymId is required",
      });
    }

    const { gymIds, isSuper } = await resolveGymScope(req);

    if (!isSuper && !ownsGym(gymIds, targetGymId)) {
      return res.status(403).json({
        success: false,
        message: "You can only add branches to your own gym",
      });
    }

    const gym = await Gym.findById(targetGymId);
    if (!gym) {
      return res.status(404).json({
        success: false,
        message: "Gym not found",
      });
    }

    const branch = await Branch.create({
      gymId: targetGymId,
      name: name.trim(),
      email: email || "",
      phone: phone || "",
      address: address || "",
    });

    return res.status(201).json({
      success: true,
      message: "Branch created successfully",
      branch,
    });
  } catch (error) {
    console.error("Create branch error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to create branch",
    });
  }
};

/**
 * getBranches — role aware list.
 * SUPER_ADMIN: all (optional ?gymId). OWNER: own gyms' branches.
 * GYM_ADMIN/staff: their gym's branches.
 */
export const getBranches = async (req, res) => {
  try {
    const { gymIds, isSuper } = await resolveGymScope(req);

    const filter = {};

    if (isSuper) {
      if (req.query.gymId) filter.gymId = req.query.gymId;
    } else {
      filter.gymId = { $in: gymIds };
    }

    const branches = await Branch.find(filter)
      .populate("gymId", "name email phone address")
      .populate("admin", "name email phone role")
      .sort({ createdAt: -1 })
      .lean();

    const branchIds = branches.map((b) => b._id);
    const memberCounts = await Customer.aggregate([
      { $match: { branchId: { $in: branchIds } } },
      { $group: { _id: "$branchId", count: { $sum: 1 } } },
    ]);
    const memberMap = Object.fromEntries(
      memberCounts.map((m) => [m._id?.toString(), m.count])
    );

    const enriched = branches.map((b) => ({
      ...b,
      memberCount: memberMap[b._id.toString()] || 0,
    }));

    return res.status(200).json({
      success: true,
      count: enriched.length,
      branches: enriched,
    });
  } catch (error) {
    console.error("Get branches error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to get branches",
    });
  }
};

export const updateBranch = async (req, res) => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid branch ID",
      });
    }

    const branch = await Branch.findById(id);
    if (!branch) {
      return res.status(404).json({
        success: false,
        message: "Branch not found",
      });
    }

    const { gymIds, isSuper } = await resolveGymScope(req);
    if (!isSuper && !ownsGym(gymIds, branch.gymId)) {
      return res.status(403).json({
        success: false,
        message: "Not authorized for this branch",
      });
    }

    const { name, email, phone, address, status } = req.body;
    if (name !== undefined) branch.name = name.trim();
    if (email !== undefined) branch.email = email;
    if (phone !== undefined) branch.phone = phone;
    if (address !== undefined) branch.address = address;
    if (status !== undefined && ["ACTIVE", "INACTIVE"].includes(status)) {
      branch.status = status;
    }

    await branch.save();

    return res.status(200).json({
      success: true,
      message: "Branch updated successfully",
      branch,
    });
  } catch (error) {
    console.error("Update branch error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to update branch",
    });
  }
};

export const deleteBranch = async (req, res) => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid branch ID",
      });
    }

    const branch = await Branch.findById(id);
    if (!branch) {
      return res.status(404).json({
        success: false,
        message: "Branch not found",
      });
    }

    const { gymIds, isSuper } = await resolveGymScope(req);
    if (!isSuper && !ownsGym(gymIds, branch.gymId)) {
      return res.status(403).json({
        success: false,
        message: "Not authorized for this branch",
      });
    }

    branch.status = "INACTIVE";
    await branch.save();

    return res.status(200).json({
      success: true,
      message: "Branch deactivated successfully",
    });
  } catch (error) {
    console.error("Delete branch error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to delete branch",
    });
  }
};
