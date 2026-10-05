import mongoose from "mongoose";
import Trainer from "../models/Trainer.js";
import {
  resolveScope,
  scopeToFilter,
  resolveWriteGymId,
  inScope
} from "../utils/scope.js";

export const createTrainer = async (req, res) => {
  try {
    const { name, email, phone, specialization, branchId, profileImage } =
      req.body;

    if (!name || !name.trim()) {
      return res.status(400).json({
        success: false,
        message: "Trainer name is required"
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

    const trainer = await Trainer.create({
      gymId,
      branchId: branchId || null,
      name: name.trim(),
      email: email?.trim().toLowerCase() || "",
      phone: phone?.trim() || "",
      specialization: specialization?.trim() || "",
      profileImage: profileImage || ""
    });

    return res.status(201).json({
      success: true,
      message: "Trainer created successfully",
      trainer
    });
  } catch (error) {
    console.error("Create Trainer Error:", error);
    return res.status(500).json({
      success: false,
      message: "Trainer creation failed",
      error: error.message
    });
  }
};

export const getTrainers = async (req, res) => {
  try {
    const scope = await resolveScope(req);

    if (!scope.isSuper && !scope.gymIds.length) {
      return res.status(400).json({
        success: false,
        message: "No gym is associated with your account"
      });
    }

    const query = { ...scopeToFilter(scope) };

    if (req.query.status && ["ACTIVE", "INACTIVE"].includes(req.query.status)) {
      query.status = req.query.status;
    }

    const trainers = await Trainer.find(query)
      .sort({ createdAt: -1 })
      .lean();

    return res.status(200).json({
      success: true,
      count: trainers.length,
      trainers
    });
  } catch (error) {
    console.error("Get Trainers Error:", error);
    return res.status(500).json({
      success: false,
      message: "Unable to fetch trainers",
      error: error.message
    });
  }
};

export const updateTrainer = async (req, res) => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid trainer ID"
      });
    }

    const scope = await resolveScope(req);
    const trainer = await Trainer.findById(id);

    if (!trainer || !inScope(scope, trainer.gymId)) {
      return res.status(404).json({
        success: false,
        message: "Trainer not found"
      });
    }

    const { name, email, phone, specialization, status, profileImage } =
      req.body;

    if (name !== undefined) {
      if (!name.trim()) {
        return res.status(400).json({
          success: false,
          message: "Trainer name cannot be empty"
        });
      }
      trainer.name = name.trim();
    }

    if (email !== undefined) trainer.email = email.trim().toLowerCase();
    if (phone !== undefined) trainer.phone = phone.trim();
    if (specialization !== undefined)
      trainer.specialization = specialization.trim();
    if (profileImage !== undefined) trainer.profileImage = profileImage;
    if (status !== undefined && ["ACTIVE", "INACTIVE"].includes(status)) {
      trainer.status = status;
    }

    await trainer.save();

    return res.status(200).json({
      success: true,
      message: "Trainer updated successfully",
      trainer
    });
  } catch (error) {
    console.error("Update Trainer Error:", error);
    return res.status(500).json({
      success: false,
      message: "Trainer update failed",
      error: error.message
    });
  }
};

export const deleteTrainer = async (req, res) => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid trainer ID"
      });
    }

    const scope = await resolveScope(req);
    const trainer = await Trainer.findById(id);

    if (!trainer || !inScope(scope, trainer.gymId)) {
      return res.status(404).json({
        success: false,
        message: "Trainer not found"
      });
    }

    await Trainer.findByIdAndDelete(id);

    return res.status(200).json({
      success: true,
      message: "Trainer deleted successfully"
    });
  } catch (error) {
    console.error("Delete Trainer Error:", error);
    return res.status(500).json({
      success: false,
      message: "Trainer deletion failed",
      error: error.message
    });
  }
};
