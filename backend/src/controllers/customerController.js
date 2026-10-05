import mongoose from "mongoose";
import Customer from "../models/Customer.js";
import Gym from "../models/Gym.js";
import Payment from "../models/Payment.js";
import Attendance from "../models/Attendance.js";
import {
  resolveScope,
  scopeToFilter,
  resolveWriteGymId,
  inScope,
} from "../utils/scope.js";

// Add one calendar month to a date.
const addOneMonth = (date) => {
  const next = new Date(date);
  next.setMonth(next.getMonth() + 1);
  return next;
};

// Derive the live fee status: a member whose next due date has passed
// and who has not paid for the current cycle is OVERDUE.
const deriveFeeStatus = (customer) => {
  if (!customer.monthlyFee || customer.monthlyFee <= 0) return "PAID";
  if (!customer.nextFeeDate) return "DUE";

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const next = new Date(customer.nextFeeDate);
  next.setHours(0, 0, 0, 0);

  return next < today ? "OVERDUE" : customer.feeStatus || "DUE";
};

const allowedRoles = [
  "SUPER_ADMIN",
  "OWNER",
  "GYM_ADMIN",
  "MANAGER",
  "STAFF"
];

const generateMemberId = async (gymId) => {
  const count = await Customer.countDocuments({ gymId });
  return `MEM-${String(count + 1).padStart(5, "0")}`;
};

export const createCustomer = async (req, res) => {
  try {
    if (!allowedRoles.includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        message: "You do not have permission to create customers"
      });
    }

    const {
      name,
      email,
      phone,
      dateOfBirth,
      gender,
      address,
      emergencyContactName,
      emergencyContactPhone,
      membershipPlan,
      membershipStartDate,
      membershipExpiryDate,
      monthlyFee,
      notes,
      profileImage
    } = req.body;

    const scope = await resolveScope(req);
    const gymId = resolveWriteGymId(req, scope);

    if (!gymId) {
      return res.status(400).json({
        success: false,
        message: "A valid gym ID is required"
      });
    }

    if (!mongoose.Types.ObjectId.isValid(gymId)) {
      return res.status(400).json({
        success: false,
        message: "Invalid gym ID"
      });
    }

    if (!name || !name.trim()) {
      return res.status(400).json({
        success: false,
        message: "Customer name is required"
      });
    }

    if (!phone || !phone.trim()) {
      return res.status(400).json({
        success: false,
        message: "Customer phone is required"
      });
    }

    if (
      email &&
      email.trim() &&
      !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())
    ) {
      return res.status(400).json({
        success: false,
        message: "Invalid email address"
      });
    }

    if (
      membershipStartDate &&
      membershipExpiryDate &&
      new Date(membershipExpiryDate) < new Date(membershipStartDate)
    ) {
      return res.status(400).json({
        success: false,
        message: "Membership expiry date cannot be before start date"
      });
    }

    const existingCustomer = await Customer.findOne({
      gymId,
      phone: phone.trim()
    });

    if (existingCustomer) {
      return res.status(400).json({
        success: false,
        message: "A customer with this phone number already exists in this gym"
      });
    }

    const memberId = await generateMemberId(gymId);

    // Resolve the effective monthly fee: explicit value wins, otherwise
    // fall back to the gym's configured default.
    let effectiveFee = Number(monthlyFee);
    if (!Number.isFinite(effectiveFee) || effectiveFee < 0) {
      const gym = await Gym.findById(gymId).select("settings").lean();
      effectiveFee = Number(gym?.settings?.monthlyFee) || 0;
    }

    const feeStart = membershipStartDate
      ? new Date(membershipStartDate)
      : new Date();
    const nextFeeDate = effectiveFee > 0 ? addOneMonth(feeStart) : null;
    const feeStatus = effectiveFee > 0 ? "DUE" : "PAID";

    let membershipStatus = "NONE";

    if (membershipExpiryDate) {
      const expiryDate = new Date(membershipExpiryDate);
      const today = new Date();

      today.setHours(0, 0, 0, 0);
      expiryDate.setHours(0, 0, 0, 0);

      const daysRemaining = Math.ceil(
        (expiryDate - today) / (1000 * 60 * 60 * 24)
      );

      if (daysRemaining < 0) {
        membershipStatus = "EXPIRED";
      } else if (daysRemaining <= 7) {
        membershipStatus = "EXPIRING";
      } else {
        membershipStatus = "ACTIVE";
      }
    }

    const customer = await Customer.create({
      gymId,
      memberId,
      name: name.trim(),
      email: email?.trim().toLowerCase() || "",
      phone: phone.trim(),
      dateOfBirth: dateOfBirth || null,
      gender: gender || "OTHER",
      address: address?.trim() || "",
      emergencyContactName:
        emergencyContactName?.trim() || "",
      emergencyContactPhone:
        emergencyContactPhone?.trim() || "",
      membershipPlan:
        membershipPlan?.trim() || "",
      membershipStartDate:
        membershipStartDate || null,
      membershipExpiryDate:
        membershipExpiryDate || null,
      membershipStatus,
      status: "ACTIVE",
      monthlyFee: effectiveFee,
      feeStatus,
      nextFeeDate,
      lastFeePaidDate: null,
      notes: notes?.trim() || "",
      profileImage: profileImage || ""
    });

    return res.status(201).json({
      success: true,
      message: "Customer created successfully",
      customer
    });
  } catch (error) {
    console.error("Create Customer Error:", error);

    return res.status(500).json({
      success: false,
      message: "Customer creation failed",
      error: error.message
    });
  }
};

export const getCustomers = async (req, res) => {
  try {
    if (!allowedRoles.includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        message: "You do not have permission to view customers"
      });
    }

    const scope = await resolveScope(req);

    if (!scope.isSuper && !scope.gymIds.length) {
      return res.status(400).json({
        success: false,
        message: "No gym is associated with your account"
      });
    }

    const {
      search,
      status,
      membershipStatus,
      page = 1,
      limit = 20
    } = req.query;

    const query = {
      ...scopeToFilter(scope)
    };

    if (status && ["ACTIVE", "INACTIVE"].includes(status)) {
      query.status = status;
    }

    if (
      membershipStatus &&
      ["ACTIVE", "EXPIRING", "EXPIRED", "NONE"].includes(
        membershipStatus
      )
    ) {
      query.membershipStatus = membershipStatus;
    }

    if (search && search.trim()) {
      const searchValue = search.trim();

      query.$or = [
        {
          name: {
            $regex: searchValue,
            $options: "i"
          }
        },
        {
          email: {
            $regex: searchValue,
            $options: "i"
          }
        },
        {
          phone: {
            $regex: searchValue,
            $options: "i"
          }
        },
        {
          memberId: {
            $regex: searchValue,
            $options: "i"
          }
        }
      ];
    }

    const pageNumber = Math.max(Number(page), 1);
    const limitNumber = Math.min(
      Math.max(Number(limit), 1),
      100
    );

    const skip = (pageNumber - 1) * limitNumber;

    const [customers, total] = await Promise.all([
      Customer.find(query)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limitNumber),

      Customer.countDocuments(query)
    ]);

    return res.status(200).json({
      success: true,
      count: customers.length,
      total,
      page: pageNumber,
      pages: Math.ceil(total / limitNumber),
      customers
    });
  } catch (error) {
    console.error("Get Customers Error:", error);

    return res.status(500).json({
      success: false,
      message: "Unable to fetch customers",
      error: error.message
    });
  }
};

export const getCustomer = async (req, res) => {
  try {
    if (!allowedRoles.includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        message: "You do not have permission to view this customer"
      });
    }

    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid customer ID"
      });
    }

    const scope = await resolveScope(req);

    const customer = await Customer.findById(id);

    if (!customer || !inScope(scope, customer.gymId)) {
      return res.status(404).json({
        success: false,
        message: "Customer not found"
      });
    }

    return res.status(200).json({
      success: true,
      customer
    });
  } catch (error) {
    console.error("Get Customer Error:", error);

    return res.status(500).json({
      success: false,
      message: "Unable to fetch customer",
      error: error.message
    });
  }
};

export const updateCustomer = async (req, res) => {
  try {
    if (!allowedRoles.includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        message: "You do not have permission to update customers"
      });
    }

    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid customer ID"
      });
    }

    const scope = await resolveScope(req);

    const customer = await Customer.findById(id);

    if (!customer || !inScope(scope, customer.gymId)) {
      return res.status(404).json({
        success: false,
        message: "Customer not found"
      });
    }

    const gymId = customer.gymId;

    const {
      name,
      email,
      phone,
      dateOfBirth,
      gender,
      address,
      emergencyContactName,
      emergencyContactPhone,
      membershipPlan,
      membershipStartDate,
      membershipExpiryDate,
      membershipStatus,
      status,
      monthlyFee,
      notes,
      profileImage
    } = req.body;

    if (name !== undefined) {
      if (!name.trim()) {
        return res.status(400).json({
          success: false,
          message: "Customer name cannot be empty"
        });
      }

      customer.name = name.trim();
    }

    if (phone !== undefined) {
      if (!phone.trim()) {
        return res.status(400).json({
          success: false,
          message: "Customer phone cannot be empty"
        });
      }

      const duplicatePhone = await Customer.findOne({
        gymId,
        phone: phone.trim(),
        _id: { $ne: id }
      });

      if (duplicatePhone) {
        return res.status(400).json({
          success: false,
          message: "Another customer already uses this phone number"
        });
      }

      customer.phone = phone.trim();
    }

    if (email !== undefined) {
      if (
        email.trim() &&
        !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())
      ) {
        return res.status(400).json({
          success: false,
          message: "Invalid email address"
        });
      }

      customer.email = email.trim().toLowerCase();
    }

    if (dateOfBirth !== undefined) {
      customer.dateOfBirth = dateOfBirth || null;
    }

    if (gender !== undefined) {
      if (!["MALE", "FEMALE", "OTHER"].includes(gender)) {
        return res.status(400).json({
          success: false,
          message: "Invalid gender"
        });
      }

      customer.gender = gender;
    }

    if (address !== undefined) {
      customer.address = address.trim();
    }

    if (emergencyContactName !== undefined) {
      customer.emergencyContactName =
        emergencyContactName.trim();
    }

    if (emergencyContactPhone !== undefined) {
      customer.emergencyContactPhone =
        emergencyContactPhone.trim();
    }

    if (membershipPlan !== undefined) {
      customer.membershipPlan = membershipPlan.trim();
    }

    if (membershipStartDate !== undefined) {
      customer.membershipStartDate =
        membershipStartDate || null;
    }

    if (membershipExpiryDate !== undefined) {
      customer.membershipExpiryDate =
        membershipExpiryDate || null;
    }

    if (
      membershipStartDate !== undefined ||
      membershipExpiryDate !== undefined
    ) {
      const startDate = customer.membershipStartDate;
      const expiryDate = customer.membershipExpiryDate;

      if (
        startDate &&
        expiryDate &&
        new Date(expiryDate) < new Date(startDate)
      ) {
        return res.status(400).json({
          success: false,
          message: "Membership expiry date cannot be before start date"
        });
      }

      if (expiryDate) {
        const expiry = new Date(expiryDate);
        const today = new Date();

        today.setHours(0, 0, 0, 0);
        expiry.setHours(0, 0, 0, 0);

        const daysRemaining = Math.ceil(
          (expiry - today) / (1000 * 60 * 60 * 24)
        );

        if (daysRemaining < 0) {
          customer.membershipStatus = "EXPIRED";
        } else if (daysRemaining <= 7) {
          customer.membershipStatus = "EXPIRING";
        } else {
          customer.membershipStatus = "ACTIVE";
        }
      } else {
        customer.membershipStatus = "NONE";
      }
    }

    if (membershipStatus !== undefined) {
      if (
        !["ACTIVE", "EXPIRING", "EXPIRED", "NONE"].includes(
          membershipStatus
        )
      ) {
        return res.status(400).json({
          success: false,
          message: "Invalid membership status"
        });
      }

      customer.membershipStatus = membershipStatus;
    }

    if (status !== undefined) {
      if (!["ACTIVE", "INACTIVE"].includes(status)) {
        return res.status(400).json({
          success: false,
          message: "Invalid customer status"
        });
      }

      customer.status = status;
    }

    if (monthlyFee !== undefined) {
      const fee = Number(monthlyFee);

      if (!Number.isFinite(fee) || fee < 0) {
        return res.status(400).json({
          success: false,
          message: "Invalid monthly fee"
        });
      }

      const hadNoFee = !customer.monthlyFee || customer.monthlyFee <= 0;
      customer.monthlyFee = fee;

      if (fee > 0 && hadNoFee && !customer.nextFeeDate) {
        // Switching an unpaid-tracked member onto a monthly fee: start a cycle.
        customer.nextFeeDate = addOneMonth(
          customer.membershipStartDate || new Date()
        );
        customer.feeStatus = "DUE";
      } else if (fee <= 0) {
        customer.feeStatus = "PAID";
        customer.nextFeeDate = null;
      }
    }

    if (notes !== undefined) {
      customer.notes = notes.trim();
    }

    if (profileImage !== undefined) {
      customer.profileImage = profileImage;
    }

    await customer.save();

    return res.status(200).json({
      success: true,
      message: "Customer updated successfully",
      customer
    });
  } catch (error) {
    console.error("Update Customer Error:", error);

    return res.status(500).json({
      success: false,
      message: "Customer update failed",
      error: error.message
    });
  }
};

export const toggleCustomerStatus = async (req, res) => {
  try {
    if (!allowedRoles.includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        message: "You do not have permission to change customer status"
      });
    }

    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid customer ID"
      });
    }

    const scope = await resolveScope(req);

    const customer = await Customer.findById(id);

    if (!customer || !inScope(scope, customer.gymId)) {
      return res.status(404).json({
        success: false,
        message: "Customer not found"
      });
    }

    customer.status =
      customer.status === "ACTIVE"
        ? "INACTIVE"
        : "ACTIVE";

    await customer.save();

    return res.status(200).json({
      success: true,
      message:
        customer.status === "ACTIVE"
          ? "Customer activated successfully"
          : "Customer deactivated successfully",
      customer
    });
  } catch (error) {
    console.error("Toggle Customer Status Error:", error);

    return res.status(500).json({
      success: false,
      message: "Unable to update customer status",
      error: error.message
    });
  }
};

export const deleteCustomer = async (req, res) => {
  try {
    if (!["SUPER_ADMIN", "OWNER", "GYM_ADMIN"].includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        message: "You do not have permission to delete customers"
      });
    }

    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid customer ID"
      });
    }

    const scope = await resolveScope(req);

    const customer = await Customer.findById(id);

    if (!customer || !inScope(scope, customer.gymId)) {
      return res.status(404).json({
        success: false,
        message: "Customer not found"
      });
    }

    await Customer.findByIdAndDelete(id);

    return res.status(200).json({
      success: true,
      message: "Customer deleted successfully"
    });
  } catch (error) {
    console.error("Delete Customer Error:", error);

    return res.status(500).json({
      success: false,
      message: "Customer deletion failed",
      error: error.message
    });
  }
};

export const getCustomerStats = async (req, res) => {
  try {
    if (!allowedRoles.includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        message: "You do not have permission to view customer statistics"
      });
    }

    const scope = await resolveScope(req);

    if (!scope.isSuper && !scope.gymIds.length) {
      return res.status(400).json({
        success: false,
        message: "No gym is associated with your account"
      });
    }

    const gymMatch = scopeToFilter(scope);

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const sevenDaysLater = new Date(today);
    sevenDaysLater.setDate(
      sevenDaysLater.getDate() + 7
    );

    const [
      total,
      active,
      inactive,
      expiring,
      expired
    ] = await Promise.all([
      Customer.countDocuments({ ...gymMatch }),

      Customer.countDocuments({
        ...gymMatch,
        status: "ACTIVE"
      }),

      Customer.countDocuments({
        ...gymMatch,
        status: "INACTIVE"
      }),

      Customer.countDocuments({
        ...gymMatch,
        membershipExpiryDate: {
          $gte: today,
          $lte: sevenDaysLater
        },
        status: "ACTIVE"
      }),

      Customer.countDocuments({
        ...gymMatch,
        membershipExpiryDate: {
          $lt: today
        },
        status: "ACTIVE"
      })
    ]);

    return res.status(200).json({
      success: true,
      stats: {
        total,
        active,
        inactive,
        expiring,
        expired
      }
    });
  } catch (error) {
    console.error("Get Customer Stats Error:", error);

    return res.status(500).json({
      success: false,
      message: "Unable to fetch customer statistics",
      error: error.message
    });
  }
};

// Record a monthly-fee payment for a member: logs a Payment, marks the
// member PAID, and advances the next due date by one month.
export const payFee = async (req, res) => {
  try {
    const manageRoles = ["SUPER_ADMIN", "OWNER", "GYM_ADMIN", "MANAGER", "STAFF"];

    if (!manageRoles.includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        message: "You do not have permission to collect fees"
      });
    }

    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid customer ID"
      });
    }

    const scope = await resolveScope(req);
    const customer = await Customer.findById(id);

    if (!customer || !inScope(scope, customer.gymId)) {
      return res.status(404).json({
        success: false,
        message: "Customer not found"
      });
    }

    const { amount, method, note } = req.body;

    const payAmount =
      amount !== undefined && amount !== null && amount !== ""
        ? Number(amount)
        : Number(customer.monthlyFee) || 0;

    if (!Number.isFinite(payAmount) || payAmount < 0) {
      return res.status(400).json({
        success: false,
        message: "Invalid payment amount"
      });
    }

    const now = new Date();

    // Advance from the current due date when it exists so cycles don't drift,
    // otherwise start a fresh cycle from today.
    const base =
      customer.nextFeeDate && new Date(customer.nextFeeDate) > now
        ? new Date(customer.nextFeeDate)
        : now;

    customer.lastFeePaidDate = now;
    customer.nextFeeDate = addOneMonth(base);
    customer.feeStatus = "PAID";

    await customer.save();

    const payment = await Payment.create({
      gymId: customer.gymId,
      customerId: customer._id,
      amount: payAmount,
      method: method || "CASH",
      status: "PAID",
      note: note?.trim() || "Monthly fee",
      paidAt: now
    });

    return res.status(201).json({
      success: true,
      message: "Fee collected successfully",
      customer,
      payment
    });
  } catch (error) {
    console.error("Pay Fee Error:", error);

    return res.status(500).json({
      success: false,
      message: "Fee collection failed",
      error: error.message
    });
  }
};

// Self-service read for a logged-in CUSTOMER: their own profile plus
// recent attendance and payment history. Strictly read-only.
export const getMe = async (req, res) => {
  try {
    const customer = await Customer.findOne({ userId: req.user._id });

    if (!customer) {
      return res.status(404).json({
        success: false,
        message: "No member profile is linked to your account"
      });
    }

    customer.feeStatus = deriveFeeStatus(customer);

    const [attendance, payments] = await Promise.all([
      Attendance.find({ customerId: customer._id })
        .sort({ date: -1, createdAt: -1 })
        .limit(60)
        .lean(),

      Payment.find({ customerId: customer._id })
        .sort({ paidAt: -1 })
        .limit(60)
        .lean()
    ]);

    return res.status(200).json({
      success: true,
      customer,
      attendance,
      payments
    });
  } catch (error) {
    console.error("Get Me Error:", error);

    return res.status(500).json({
      success: false,
      message: "Unable to fetch your profile",
      error: error.message
    });
  }
};

