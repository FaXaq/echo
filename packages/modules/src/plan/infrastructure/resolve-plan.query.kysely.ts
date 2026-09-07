import type { ResolvePlanQueryPortFactory } from "./resolve-plan.query.port.js";

export const resolvePlanQueryFactory: ResolvePlanQueryPortFactory = () => async (_db, _scope) => {
  return "free";
};
