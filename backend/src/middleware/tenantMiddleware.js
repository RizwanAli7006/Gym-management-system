import Gym from "../models/Gym.js";

/**
 * Returns the list of Gym ObjectIds owned by a given user (OWNER role).
 * Used to scope every tenant-aware query for owners who may own
 * more than one gym.
 */
export const resolveOwnedGymIds = async (userId) => {
  const gyms = await Gym.find({ owner: userId }).select("_id").lean();
  return gyms.map((gym) => gym._id);
};

/**
 * attachTenantScope
 *
 * Computes a MongoDB filter that isolates data by role and attaches it to
 * the request as `req.scopeFilter`, plus a `req.tenant` summary object.
 *
 *  SUPER_ADMIN            -> {}                                (sees everything)
 *  OWNER                  -> { gymId: { $in: ownedGymIds } }   (own gyms only)
 *  GYM_ADMIN/MANAGER/STAFF/TRAINER
 *                         -> { gymId: req.user.gymId }         (their gym)
 *  CUSTOMER               -> { userId: req.user._id }          (themselves)
 *
 * Super admins may optionally narrow to a single gym with ?gymId=...
 */
export const attachTenantScope = async (req, res, next) => {
  try {
    const user = req.user;

    if (!user) {
      return res.status(401).json({
        success: false,
        message: "Authentication required",
      });
    }

    const tenant = {
      role: user.role,
      gymId: user.gymId || null,
      gymIds: [],
    };

    let scopeFilter = {};

    switch (user.role) {
      case "SUPER_ADMIN": {
        const requestedGymId = req.query.gymId || req.body?.gymId;
        scopeFilter = requestedGymId ? { gymId: requestedGymId } : {};
        break;
      }

      case "OWNER": {
        const ownedGymIds = await resolveOwnedGymIds(user._id);
        tenant.gymIds = ownedGymIds;
        scopeFilter = { gymId: { $in: ownedGymIds } };
        break;
      }

      case "GYM_ADMIN":
      case "MANAGER":
      case "STAFF":
      case "TRAINER": {
        if (!user.gymId) {
          return res.status(403).json({
            success: false,
            message: "No gym is assigned to this account",
          });
        }
        tenant.gymIds = [user.gymId];
        scopeFilter = { gymId: user.gymId };
        break;
      }

      case "CUSTOMER": {
        scopeFilter = { userId: user._id };
        break;
      }

      default: {
        scopeFilter = { _id: null }; // match nothing
      }
    }

    req.tenant = tenant;
    req.scopeFilter = scopeFilter;

    next();
  } catch (error) {
    console.error("Tenant scope error:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to resolve tenant scope",
    });
  }
};

export default attachTenantScope;
