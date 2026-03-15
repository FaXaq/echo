import { mergeRouters, router } from "../trpc";
import { makeHealthRouter } from "./health";
import { makeInvitationRouter } from "./invitation";
import { makeDebugRouter } from "./debug";
import { makeOrganizationRouter } from "./organizations/index";

export const makeAppRouter = () =>
  mergeRouters(
    makeHealthRouter(),
    router({
      invitation: makeInvitationRouter(),
      debug: makeDebugRouter(),
      organization: makeOrganizationRouter(),
    }),
  );

export type AppRouter = ReturnType<typeof makeAppRouter>;
