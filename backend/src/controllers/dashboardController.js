import Gym from "../models/Gym.js";
import Branch from "../models/Branch.js";
import Customer from "../models/Customer.js";
import Trainer from "../models/Trainer.js";
import Payment from "../models/Payment.js";
import Attendance from "../models/Attendance.js";
import { resolveOwnedGymIds } from "../middleware/tenantMiddleware.js";

// Resolve the set of gyms the current user may report on.
const resolveScope = async (req) => {
  if (req.user.role === "SUPER_ADMIN") {
    const requested = req.query.gymId || null;
    return { isSuper: true, gymIds: requested ? [requested] : [] };
  }

  if (req.user.role === "OWNER") {
    const gymIds = await resolveOwnedGymIds(req.user._id);
    return { isSuper: false, gymIds };
  }

  return {
    isSuper: false,
    gymIds: req.user.gymId ? [req.user.gymId] : []
  };
};

// Mongo match fragment limiting a query to the resolved scope.
const scopeToFilter = (scope) => {
  if (scope.isSuper) {
    return scope.gymIds.length ? { gymId: scope.gymIds[0] } : {};
  }
  return { gymId: { $in: scope.gymIds } };
};

const sumPaid = async (match) => {
  const result = await Payment.aggregate([
    { $match: { ...match, status: "PAID" } },
    { $group: { _id: null, total: { $sum: "$amount" } } }
  ]);
  return result.length ? result[0].total : 0;
};

// Platform-wide dashboard for the SUPER_ADMIN.
const superAdminDashboard = async (res, scope) => {
  const gymMatch = scopeToFilter(scope);

  const [
    totalGyms,
    totalBranches,
    totalMembers,
    totalTrainers,
    revenue,
    recentGyms
  ] = await Promise.all([
    scope.gymIds.length
      ? Gym.countDocuments({ _id: scope.gymIds[0] })
      : Gym.countDocuments({}),
    Branch.countDocuments(gymMatch),
    Customer.countDocuments(gymMatch),
    Trainer.countDocuments(gymMatch),
    sumPaid(gymMatch),
    Gym.find(scope.gymIds.length ? { _id: scope.gymIds[0] } : {})
      .populate("owner", "name email")
      .sort({ createdAt: -1 })
      .limit(5)
      .lean()
  ]);

  return res.status(200).json({
    success: true,
    role: "SUPER_ADMIN",
    stats: {
      totalGyms,
      totalBranches,
      totalMembers,
      totalTrainers,
      revenue
    },
    recentGyms
  });
};

// Owner dashboard — totals across every gym the owner holds.
const ownerDashboard = async (res, scope) => {
  if (!scope.gymIds.length) {
    return res.status(200).json({
      success: true,
      role: "OWNER",
      stats: {
        totalGyms: 0,
        totalBranches: 0,
        totalMembers: 0,
        totalTrainers: 0,
        revenue: 0
      },
      gyms: []
    });
  }

  const gymMatch = { gymId: { $in: scope.gymIds } };

  const [
    totalBranches,
    totalMembers,
    totalTrainers,
    revenue,
    gyms
  ] = await Promise.all([
    Branch.countDocuments(gymMatch),
    Customer.countDocuments(gymMatch),
    Trainer.countDocuments(gymMatch),
    sumPaid(gymMatch),
    Gym.find({ _id: { $in: scope.gymIds } })
      .sort({ createdAt: -1 })
      .lean()
  ]);

  return res.status(200).json({
    success: true,
    role: "OWNER",
    stats: {
      totalGyms: scope.gymIds.length,
      totalBranches,
      totalMembers,
      totalTrainers,
      revenue
    },
    gyms
  });
};

// Gym admin / staff dashboard — single gym totals.
const gymAdminDashboard = async (res, scope) => {
  if (!scope.gymIds.length) {
    return res.status(403).json({
      success: false,
      message: "No gym is assigned to this account"
    });
  }

  const gymId = scope.gymIds[0];
  const gymMatch = { gymId };

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const dateKey = today.toISOString().slice(0, 10);

  const [
    totalMembers,
    activeMembers,
    totalTrainers,
    totalBranches,
    revenue,
    checkInsToday
  ] = await Promise.all([
    Customer.countDocuments(gymMatch),
    Customer.countDocuments({ ...gymMatch, status: "ACTIVE" }),
    Trainer.countDocuments(gymMatch),
    Branch.countDocuments(gymMatch),
    sumPaid(gymMatch),
    Attendance.countDocuments({ ...gymMatch, date: dateKey })
  ]);

  return res.status(200).json({
    success: true,
    role: scope.role || "GYM_ADMIN",
    stats: {
      totalMembers,
      activeMembers,
      totalTrainers,
      totalBranches,
      revenue,
      checkInsToday
    }
  });
};

// Personal dashboard for a CUSTOMER.
const customerDashboard = async (req, res) => {
  const customer = await Customer.findOne({ userId: req.user._id }).lean();

  if (!customer) {
    return res.status(200).json({
      success: true,
      role: "CUSTOMER",
      profile: null,
      stats: {
        membershipStatus: "NONE",
        totalPayments: 0,
        totalCheckIns: 0
      }
    });
  }

  const [payments, totalCheckIns, lastPayment] = await Promise.all([
    sumPaid({ customerId: customer._id }),
    Attendance.countDocuments({ customerId: customer._id }),
    Payment.findOne({ customerId: customer._id, status: "PAID" })
      .sort({ paidAt: -1 })
      .lean()
  ]);

  return res.status(200).json({
    success: true,
    role: "CUSTOMER",
    profile: {
      name: customer.name,
      memberId: customer.memberId,
      membershipPlan: customer.membershipPlan,
      membershipStatus: customer.membershipStatus,
      membershipExpiryDate: customer.membershipExpiryDate
    },
    stats: {
      membershipStatus: customer.membershipStatus,
      totalPayments: payments,
      totalCheckIns,
      lastPaymentAt: lastPayment ? lastPayment.paidAt : null
    }
  });
};

export const getDashboard = async (req, res) => {
  try {
    const role = req.user.role;

    if (role === "CUSTOMER") {
      return await customerDashboard(req, res);
    }

    const scope = await resolveScope(req);
    scope.role = role;

    if (role === "SUPER_ADMIN") {
      return await superAdminDashboard(res, scope);
    }

    if (role === "OWNER") {
      return await ownerDashboard(res, scope);
    }

    if (["GYM_ADMIN", "MANAGER", "STAFF", "TRAINER"].includes(role)) {
      return await gymAdminDashboard(res, scope);
    }

    return res.status(403).json({
      success: false,
      message: "You do not have access to a dashboard"
    });
  } catch (error) {
    console.error("Dashboard Error:", error);

    return res.status(500).json({
      success: false,
      message: "Unable to load dashboard",
      error: error.message
    });
  }
};

// Build an array of the last `count` month buckets, oldest first:
// [{ key: "2026-05", label: "May 2026" }, ...]
const lastMonths = (count) => {
  const buckets = [];
  const now = new Date();
  for (let i = count - 1; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
    const label = d.toLocaleDateString("en-US", {
      month: "short",
      year: "numeric"
    });
    buckets.push({ key, label });
  }
  return buckets;
};

// Role-scoped analytics for the Reports pages (SUPER_ADMIN / OWNER / GYM_ADMIN).
export const getReports = async (req, res) => {
  try {
    const role = req.user.role;

    if (!["SUPER_ADMIN", "OWNER", "GYM_ADMIN", "MANAGER"].includes(role)) {
      return res.status(403).json({
        success: false,
        message: "You do not have access to reports"
      });
    }

    const scope = await resolveScope(req);
    scope.role = role;

    if (!scope.isSuper && !scope.gymIds.length) {
      return res.status(200).json({
        success: true,
        revenueByMonth: [],
        newMembersByMonth: [],
        membersByStatus: { ACTIVE: 0, INACTIVE: 0 },
        feeStatus: { PAID: 0, DUE: 0, OVERDUE: 0 },
        membershipStatus: { ACTIVE: 0, EXPIRING: 0, EXPIRED: 0, NONE: 0 },
        topPlans: [],
        totals: { revenue: 0, members: 0 }
      });
    }

    const gymMatch = scopeToFilter(scope);
    const months = lastMonths(6);
    const since = new Date();
    since.setMonth(since.getMonth() - 5);
    since.setDate(1);
    since.setHours(0, 0, 0, 0);

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const [
      revenueAgg,
      newMembersAgg,
      activeMembers,
      inactiveMembers,
      paidFees,
      dueFees,
      overdueFees,
      msActive,
      msExpiring,
      msExpired,
      msNone,
      topPlansAgg,
      totalRevenue,
      totalMembers
    ] = await Promise.all([
      Payment.aggregate([
        { $match: { ...gymMatch, status: "PAID", paidAt: { $gte: since } } },
        {
          $group: {
            _id: {
              $dateToString: { format: "%Y-%m", date: "$paidAt" }
            },
            total: { $sum: "$amount" }
          }
        }
      ]),
      Customer.aggregate([
        { $match: { ...gymMatch, createdAt: { $gte: since } } },
        {
          $group: {
            _id: {
              $dateToString: { format: "%Y-%m", date: "$createdAt" }
            },
            count: { $sum: 1 }
          }
        }
      ]),
      Customer.countDocuments({ ...gymMatch, status: "ACTIVE" }),
      Customer.countDocuments({ ...gymMatch, status: "INACTIVE" }),
      Customer.countDocuments({ ...gymMatch, feeStatus: "PAID" }),
      Customer.countDocuments({
        ...gymMatch,
        monthlyFee: { $gt: 0 },
        feeStatus: { $ne: "PAID" },
        $or: [{ nextFeeDate: null }, { nextFeeDate: { $gte: today } }]
      }),
      Customer.countDocuments({
        ...gymMatch,
        monthlyFee: { $gt: 0 },
        feeStatus: { $ne: "PAID" },
        nextFeeDate: { $lt: today }
      }),
      Customer.countDocuments({ ...gymMatch, membershipStatus: "ACTIVE" }),
      Customer.countDocuments({ ...gymMatch, membershipStatus: "EXPIRING" }),
      Customer.countDocuments({ ...gymMatch, membershipStatus: "EXPIRED" }),
      Customer.countDocuments({ ...gymMatch, membershipStatus: "NONE" }),
      Customer.aggregate([
        {
          $match: {
            ...gymMatch,
            membershipPlan: { $nin: ["", null] }
          }
        },
        { $group: { _id: "$membershipPlan", count: { $sum: 1 } } },
        { $sort: { count: -1 } },
        { $limit: 5 }
      ]),
      sumPaid(gymMatch),
      Customer.countDocuments(gymMatch)
    ]);

    const revenueMap = Object.fromEntries(
      revenueAgg.map((r) => [r._id, r.total])
    );
    const newMembersMap = Object.fromEntries(
      newMembersAgg.map((r) => [r._id, r.count])
    );

    return res.status(200).json({
      success: true,
      revenueByMonth: months.map((m) => ({
        label: m.label,
        value: revenueMap[m.key] || 0
      })),
      newMembersByMonth: months.map((m) => ({
        label: m.label,
        value: newMembersMap[m.key] || 0
      })),
      membersByStatus: {
        ACTIVE: activeMembers,
        INACTIVE: inactiveMembers
      },
      feeStatus: {
        PAID: paidFees,
        DUE: dueFees,
        OVERDUE: overdueFees
      },
      membershipStatus: {
        ACTIVE: msActive,
        EXPIRING: msExpiring,
        EXPIRED: msExpired,
        NONE: msNone
      },
      topPlans: topPlansAgg.map((p) => ({ name: p._id, count: p.count })),
      totals: {
        revenue: totalRevenue,
        members: totalMembers
      }
    });
  } catch (error) {
    console.error("Reports Error:", error);

    return res.status(500).json({
      success: false,
      message: "Unable to load reports",
      error: error.message
    });
  }
};
