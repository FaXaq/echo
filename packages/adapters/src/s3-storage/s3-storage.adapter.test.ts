import { describe, expect, it } from "vitest";
import { attachmentDisposition } from "./s3-storage.adapter.js";

describe("attachmentDisposition", () => {
  it("percent-encodes the filename, including RFC 5987 reserved characters", () => {
    expect(attachmentDisposition("Répét (live)'s.mov")).toBe(
      "attachment; filename*=UTF-8''R%C3%A9p%C3%A9t%20%28live%29%27s.mov",
    );
  });
});
