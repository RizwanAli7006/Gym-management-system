import mongoose from "mongoose";
import MembershipPlan from "../models/MembershipPlan.js";
import {
  resolveScope,
  resolveWriteGymId,
  inScope
} from "../utils/scope.js";

export const createPlan = async (req, res) => {
  try {
    const { name, description, price, durationDays, features } = req.body;

    if (!name || !name.trim()) {
      return res.status(400).json({
        success: false,
        message: "Plan name is required"
      });
    }

    if (price === undefined || Number(price) < 0) {
      return res.status(400).json({
        success: false,
        message: "A valid price is required"
      });
    }

    const scope = await resolveScope(req);
    let gymId = resolveWriteGymId(req, scope);

    // SUPER_ADMIN may create a global plan (no gym) when none is given.
    if (!gymId && !scope.isSuper) {
      return res.status(400).json({
        success: false,
        message: "A valid gym ID is required"
      });
    }

    if (gymId && !mongoose.Types.ObjectId.isValid(gymId)) {
      return res.status(400).json({
        success: false,
        message: "Invalid gym ID"
      });
    }

    const plan = await MembershipPlan.create({
      gymId: gymId || null,
      name: name.trim(),
      description: description?.trim() || "",
      price: Number(price),
      durationDays: durationDays ? Number(durationDays) : 30,
      features: Array.isArray(features) ? features : []
    });

    return res.status(201).json({
      success: true,
      message: "Membership plan created successfully",
      plan
    });
  } catch (error) {
    console.error("Create Plan Error:", error);
    return res.status(500).json({
      success: false,
      message: "Plan creation failed",
      error: error.message
    });
  }
};

export const getPlans = async (req, res) => {
  try {
    const scope = await resolveScope(req);

    let query;

    if (scope.isSuper) {
      query = scope.gymIds.length
        ? { $or: [{ gymId: scope.gymIds[0] }, { gymId: null }] }
        : {};
    } else {
      if (!scope.gymIds.length) {
        return res.status(400).json({
          success: false,
          message: "No gym is associated with your account"
        });
      }
      // Gym-specific plans plus shared global plans.
      query = { $or: [{ gymId: { $in: scope.gymIds } }, { gymId: null }] };
    }

    const plans = await MembershipPlan.find(query)
      .sort({ price: 1 })
      .lean();

    return res.status(200).json({
      success: true,
      count: plans.length,
      plans
    });
  } catch (error) {
    console.error("Get Plans Error:", error);
    return res.status(500).json({
      success: false,
      message: "Unable to fetch plans",
      error: error.message
    });
  }
};

export const updatePlan = async (req, res) => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid plan ID"
      });
    }

    const scope = await resolveScope(req);
    const plan = await MembershipPlan.findById(id);

    // Global plans (gymId null) are editable only by SUPER_ADMIN.
    const reachable = plan && (plan.gymId
      ? inScope(scope, plan.gymId)
      : scope.isSuper);

    if (!plan || !reachable) {
      return res.status(404).json({
        success: false,
        message: "Plan not found"
      });
    }

    const { name, description, price, durationDays, features, status } =
      req.body;

    if (name !== undefined) {
      if (!name.trim()) {
        return res.status(400).json({
          success: false,
          message: "Plan name cannot be empty"
        });
      }
      plan.name = name.trim();
    }

    if (description !== undefined) plan.description = description.trim();
    if (price !== undefined && Number(price) >= 0) plan.price = Number(price);
    if (durationDays !== undefined && Number(durationDays) >= 1) {
      plan.durationDays = Number(durationDays);
    }
    if (Array.isArray(features)) plan.features = features;
    if (status !== undefined && ["ACTIVE", "INACTIVE"].includes(status)) {
      plan.status = status;
    }

    await plan.save();

    return res.status(200).json({
      success: true,
      message: "Plan updated successfully",
      plan
    });
  } catch (error) {
    console.error("Update Plan Error:", error);
    return res.status(500).json({
      success: false,
      message: "Plan update failed",
      error: error.message
    });
  }
};

export const deletePlan = async (req, res) => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid plan ID"
      });
    }

    const scope = await resolveScope(req);
    const plan = await MembershipPlan.findById(id);

    const reachable = plan && (plan.gymId
      ? inScope(scope, plan.gymId)
      : scope.isSuper);

    if (!plan || !reachable) {
      return res.status(404).json({
        success: false,
        message: "Plan not found"
      });
    }

    await MembershipPlan.findByIdAndDelete(id);

    return res.status(200).json({
      success: true,
      message: "Plan deleted successfully"
    });
  } catch (error) {
    console.error("Delete Plan Error:", error);
    return res.status(500).json({
      success: false,
      message: "Plan deletion failed",
      error: error.message
    });
  }
};
