import { mergeRouters, router } from "../trpc";
import { makeHealthRouter } from "./health";
import { makeInvitationRouter } from "./invitation";
import { makeDebugRouter } from "./debug";
import { makeOrganizationRouter } from "./organizations/index";
import { makeCalendarRouter } from "./calendar";
import { makeDriveRouter } from "./drive";
import { makePlaceRouter } from "./place";
import type { inferRouterInputs, inferRouterOutputs } from "@trpc/server";

export const makeAppRouter = () =>
  mergeRouters(
    makeHealthRouter(),
    router({
      invitation: makeInvitationRouter(),
      debug: makeDebugRouter(),
      organization: makeOrganizationRouter(),
      calendar: makeCalendarRouter(),
      drive: makeDriveRouter(),
      place: makePlaceRouter(),
    }),
  );

export type AppRouter = ReturnType<typeof makeAppRouter>;
export type RouterOutputs = inferRouterOutputs<AppRouter>;
export type RouterInputs = inferRouterInputs<AppRouter>;
