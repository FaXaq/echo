import { describe, expect, it } from "vitest";
import { conflict, notFound } from "@echo/errors";
import { router, publicProcedure, type Context } from "./trpc";

const testRouter = router({
  throwsConflict: publicProcedure.query(() => {
    throw conflict("boom");
  }),
  throwsNotFound: publicProcedure.query(() => {
    throw notFound("Widget");
  }),
  succeeds: publicProcedure.query(() => "ok"),
});

const ctx = {} as Context;

describe("appErrorMiddleware", () => {
  it("maps a thrown ConflictError to a CONFLICT TRPCError, not a generic INTERNAL_SERVER_ERROR", async () => {
    const caller = testRouter.createCaller(ctx);
    await expect(caller.throwsConflict()).rejects.toMatchObject({
      code: "CONFLICT",
      message: "boom",
    });
  });

  it("maps a thrown NotFoundError to a NOT_FOUND TRPCError, not a generic INTERNAL_SERVER_ERROR", async () => {
    const caller = testRouter.createCaller(ctx);
    await expect(caller.throwsNotFound()).rejects.toMatchObject({
      code: "NOT_FOUND",
      message: "Widget not found",
    });
  });

  it("leaves successful calls unaffected", async () => {
    const caller = testRouter.createCaller(ctx);
    await expect(caller.succeeds()).resolves.toBe("ok");
  });
});
