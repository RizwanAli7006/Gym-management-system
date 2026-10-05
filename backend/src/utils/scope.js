import Gym from "../models/Gym.js";

/**
 * Shared multi-tenant scope helpers.
 *
 * resolveScope(req)      -> { isSuper, gymIds, requested? }
 * scopeToFilter(scope)   -> mongo match fragment on gymId
 * resolveWriteGymId(req) -> a single valid gymId for a create, or null
 * inScope(scope, gymId)  -> boolean, is a record's gymId reachable
 *
 *  SUPER_ADMIN            -> all gyms (optionally one via ?gymId / body.gymId)
 *  OWNER                  -> every gym they own
 *  GYM_ADMIN/MANAGER/STAFF/TRAINER
 *                         -> their single assigned gym
 */
export const resolveScope = async (req) => {
  if (req.user.role === "SUPER_ADMIN") {
    const requested = req.query.gymId || req.body?.gymId || null;
    return { isSuper: true, gymIds: requested ? [requested] : [], requested };
  }

  if (req.user.role === "OWNER") {
    const gyms = await Gym.find({ owner: req.user._id })
      .select("_id")
      .lean();
    return { isSuper: false, gymIds: gyms.map((g) => g._id) };
  }

  return {
    isSuper: false,
    gymIds: req.user.gymId ? [req.user.gymId] : []
  };
};

export const scopeToFilter = (scope) => {
  if (scope.isSuper) {
    return scope.gymIds.length ? { gymId: scope.gymIds[0] } : {};
  }
  return { gymId: { $in: scope.gymIds } };
};

export const resolveWriteGymId = (req, scope) => {
  if (["GYM_ADMIN", "MANAGER", "STAFF", "TRAINER"].includes(req.user.role)) {
    return req.user.gymId || null;
  }

  const requested = req.body?.gymId || req.query.gymId || null;
  if (!requested) return null;
  if (scope.isSuper) return requested;

  return scope.gymIds.some(
    (id) => id.toString() === requested.toString()
  )
    ? requested
    : null;
};

export const inScope = (scope, gymId) => {
  if (!gymId) return false;
  if (scope.isSuper) {
    return (
      !scope.gymIds.length ||
      scope.gymIds[0].toString() === gymId.toString()
    );
  }
  return scope.gymIds.some(
    (id) => id.toString() === gymId.toString()
  );
};
