import mongoose from "mongoose";
import User from "../models/User.js";
import { hashPassword } from "../utils/authUtils.js";
import {
  resolveScope,
  scopeToFilter,
  resolveWriteGymId,
  inScope,
} from "../utils/scope.js";

// Staff roles that may be managed through this API. OWNER / SUPER_ADMIN /
// CUSTOMER are deliberately excluded — they are managed elsewhere.
const STAFF_ROLES = ["MANAGER", "STAFF", "TRAINER"];

export const createUser = async (req, res) => {
  try {
    const { name, email, phone, password, role } = req.body;

    if (!name || !email || !password || !role) {
      return res.status(400).json({
        success: false,
        message: "Name, email, password and role are required",
      });
    }

    if (!STAFF_ROLES.includes(role)) {
      return res.status(400).json({
        success: false,
        message: "Invalid user role",
      });
    }

    if (password.length < 6) {
      return res.status(400).json({
        success: false,
        message: "Password must be at least 6 characters",
      });
    }

    // Resolve the target gym from the caller's scope. Gym-bound creators are
    // clamped to their own gym; OWNER must target a gym they own; SUPER_ADMIN
    // may target any gym (passed via body/query).
    const scope = await resolveScope(req);
    const gymId = resolveWriteGymId(req, scope);

    if (!gymId) {
      return res.status(400).json({
        success: false,
        message: "A valid gym ID (within your access) is required",
      });
    }

    if (!mongoose.Types.ObjectId.isValid(gymId)) {
      return res.status(400).json({
        success: false,
        message: "Invalid gym ID",
      });
    }

    const normalizedEmail = email.toLowerCase().trim();

    const existingUser = await User.findOne({
      email: normalizedEmail,
    });

    if (existingUser) {
      return res.status(400).json({
        success: false,
        message: "Email already registered",
      });
    }

    const hashedPassword = await hashPassword(password);

    const user = await User.create({
      name: name.trim(),
      email: normalizedEmail,
      phone: phone || "",
      password: hashedPassword,
      role,
      gymId,
      isActive: true,
    });

    return res.status(201).json({
      success: true,
      message: "User created successfully",
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        phone: user.phone,
        role: user.role,
        gymId: user.gymId,
        isActive: user.isActive,
        profileImage: user.profileImage,
      },
    });
  } catch (error) {
    console.error("Create User Error:", error);

    return res.status(500).json({
      success: false,
      message: "User creation failed",
    });
  }
};

export const getUsers = async (req, res) => {
  try {
    const scope = await resolveScope(req);

    if (!scope.isSuper && !scope.gymIds.length) {
      return res.status(200).json({ success: true, count: 0, users: [] });
    }

    const filter = {
      ...scopeToFilter(scope),
      role: { $in: STAFF_ROLES },
    };

    // Optional narrowing by a single staff role.
    if (req.query.role && STAFF_ROLES.includes(req.query.role)) {
      filter.role = req.query.role;
    }

    const users = await User.find(filter)
      .select("-password")
      .sort({ createdAt: -1 });

    return res.status(200).json({
      success: true,
      count: users.length,
      users,
    });
  } catch (error) {
    console.error("Users Error:", error);

    return res.status(500).json({
      success: false,
      message: "Unable to fetch users",
    });
  }
};

export const getUser = async (req, res) => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid user ID",
      });
    }

    const scope = await resolveScope(req);
    const user = await User.findById(id).select("-password");

    if (!user || !inScope(scope, user.gymId)) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    return res.status(200).json({
      success: true,
      user,
    });
  } catch (error) {
    console.error("Get User Error:", error);

    return res.status(500).json({
      success: false,
      message: "Unable to fetch user",
    });
  }
};

export const updateUser = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, phone, role, password } = req.body;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid user ID",
      });
    }

    const scope = await resolveScope(req);
    const user = await User.findById(id);

    if (!user || !inScope(scope, user.gymId)) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    if (!STAFF_ROLES.includes(user.role)) {
      return res.status(403).json({
        success: false,
        message: "This user cannot be updated through this API",
      });
    }

    if (name !== undefined) {
      if (!name.trim()) {
        return res.status(400).json({
          success: false,
          message: "Name cannot be empty",
        });
      }

      user.name = name.trim();
    }

    if (phone !== undefined) {
      user.phone = phone;
    }

    if (role !== undefined) {
      if (!STAFF_ROLES.includes(role)) {
        return res.status(400).json({
          success: false,
          message: "Invalid user role",
        });
      }

      user.role = role;
    }

    if (password !== undefined) {
      if (password.length < 6) {
        return res.status(400).json({
          success: false,
          message: "Password must be at least 6 characters",
        });
      }

      user.password = await hashPassword(password);
    }

    await user.save();

    return res.status(200).json({
      success: true,
      message: "User updated successfully",
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        phone: user.phone,
        role: user.role,
        gymId: user.gymId,
        isActive: user.isActive,
        profileImage: user.profileImage,
      },
    });
  } catch (error) {
    console.error("Update User Error:", error);

    return res.status(500).json({
      success: false,
      message: "User update failed",
    });
  }
};

export const updateUserStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { isActive } = req.body;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid user ID",
      });
    }

    if (typeof isActive !== "boolean") {
      return res.status(400).json({
        success: false,
        message: "isActive must be true or false",
      });
    }

    const scope = await resolveScope(req);
    const user = await User.findById(id);

    if (!user || !inScope(scope, user.gymId)) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    if (!STAFF_ROLES.includes(user.role)) {
      return res.status(403).json({
        success: false,
        message: "This user's status cannot be changed through this API",
      });
    }

    user.isActive = isActive;

    await user.save();

    return res.status(200).json({
      success: true,
      message: isActive
        ? "User activated successfully"
        : "User deactivated successfully",
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        gymId: user.gymId,
        isActive: user.isActive,
      },
    });
  } catch (error) {
    console.error("Update User Status Error:", error);

    return res.status(500).json({
      success: false,
      message: "Unable to update user status",
    });
  }
};

// Hard-delete a staff user. Scoped to the caller's gyms.
export const deleteUser = async (req, res) => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid user ID",
      });
    }

    const scope = await resolveScope(req);
    const user = await User.findById(id);

    if (!user || !inScope(scope, user.gymId)) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    if (!STAFF_ROLES.includes(user.role)) {
      return res.status(403).json({
        success: false,
        message: "This user cannot be deleted through this API",
      });
    }

    await User.findByIdAndDelete(id);

    return res.status(200).json({
      success: true,
      message: "User deleted successfully",
    });
  } catch (error) {
    console.error("Delete User Error:", error);

    return res.status(500).json({
      success: false,
      message: "User deletion failed",
    });
  }
};
