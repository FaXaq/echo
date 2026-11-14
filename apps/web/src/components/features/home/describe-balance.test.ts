import { describe, expect, it } from "vitest";
import { describeBalance } from "./describe-balance";

describe("describeBalance", () => {
  it("classifies a balance by its sign", () => {
    expect(describeBalance(4800).kind).toBe("owed");
    expect(describeBalance(-9610).kind).toBe("owe");
    expect(describeBalance(0).kind).toBe("settled");
  });
});
