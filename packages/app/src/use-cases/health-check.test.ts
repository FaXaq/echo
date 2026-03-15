import { describe, it, expect } from "vitest";
import { makeHealthCheck } from "./health-check";
import type { HealthCheckPort } from "../ports/health";

const fakeHealthCheck = (connected: boolean): HealthCheckPort => ({
  check: async () => connected,
});

describe("makeHealthCheck", () => {
  it("returns ok when db is connected", async () => {
    const healthCheck = makeHealthCheck({
      healthCheck: fakeHealthCheck(true),
    });

    const result = await healthCheck();

    expect(result).toEqual({ status: "ok", db: true });
  });

  it("returns degraded when db is not connected", async () => {
    const healthCheck = makeHealthCheck({
      healthCheck: fakeHealthCheck(false),
    });

    const result = await healthCheck();

    expect(result).toEqual({ status: "degraded", db: false });
  });
});
