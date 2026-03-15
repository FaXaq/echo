import { Writable } from "node:stream";
import { describe, it, expect } from "vitest";
import { makeLogger } from "./make-logger";

function createTestStream() {
  const chunks: string[] = [];
  const stream = new Writable({
    write(chunk: Buffer, _encoding: string, callback: () => void) {
      chunks.push(chunk.toString().trim());
      callback();
    },
  });
  return {
    stream,
    getLogs(): Record<string, unknown>[] {
      return chunks
        .filter(Boolean)
        .map((line) => JSON.parse(line) as Record<string, unknown>);
    },
  };
}

describe("makeLogger — PII redaction contract", () => {
  it("redacts email on info", () => {
    const { stream, getLogs } = createTestStream();
    const logger = makeLogger(undefined, stream);
    logger.info({ email: "a@b.com" }, "msg");
    const [entry] = getLogs();
    expect(entry["email"]).toBe("[REDACTED]");
  });

  it("redacts password on warn", () => {
    const { stream, getLogs } = createTestStream();
    const logger = makeLogger(undefined, stream);
    logger.warn({ password: "secret" }, "msg");
    const [entry] = getLogs();
    expect(entry["password"]).toBe("[REDACTED]");
  });

  it("does not redact non-PII userId on error", () => {
    const { stream, getLogs } = createTestStream();
    const logger = makeLogger(undefined, stream);
    logger.error({ userId: "123" }, "msg");
    const [entry] = getLogs();
    expect(entry["userId"]).toBe("123");
  });

  it("redacts nir (French healthcare PII) on fatal", () => {
    const { stream, getLogs } = createTestStream();
    const logger = makeLogger(undefined, stream);
    logger.fatal({ nir: "1234" }, "msg");
    const [entry] = getLogs();
    expect(entry["nir"]).toBe("[REDACTED]");
  });

  it("does NOT redact email on debug", () => {
    const { stream, getLogs } = createTestStream();
    const logger = makeLogger({ level: "debug" }, stream);
    logger.debug({ email: "a@b.com" }, "msg");
    const [entry] = getLogs();
    expect(entry["email"]).toBe("a@b.com");
  });
});

describe("makeLogger — nested redaction", () => {
  it("redacts user.email but keeps user.id", () => {
    const { stream, getLogs } = createTestStream();
    const logger = makeLogger(undefined, stream);
    logger.info({ user: { email: "a@b.com", id: "1" } }, "msg");
    const [entry] = getLogs();
    const user = entry["user"] as Record<string, unknown>;
    expect(user["email"]).toBe("[REDACTED]");
    expect(user["id"]).toBe("1");
  });
});

describe("makeLogger — string-only calls", () => {
  it("accepts a plain string message without throwing", () => {
    const { stream, getLogs } = createTestStream();
    const logger = makeLogger(undefined, stream);
    expect(() => logger.info("plain message")).not.toThrow();
    const [entry] = getLogs();
    expect(entry["msg"]).toBe("plain message");
  });

  it("accepts plain string on warn, error, fatal, debug", () => {
    const { stream, getLogs } = createTestStream();
    const logger = makeLogger({ level: "debug" }, stream);
    logger.debug("debug msg");
    logger.warn("warn msg");
    logger.error("error msg");
    logger.fatal("fatal msg");
    const logs = getLogs();
    expect(logs[0]?.["msg"]).toBe("debug msg");
    expect(logs[1]?.["msg"]).toBe("warn msg");
    expect(logs[2]?.["msg"]).toBe("error msg");
    expect(logs[3]?.["msg"]).toBe("fatal msg");
  });
});

describe("makeLogger — child logger", () => {
  it("inherits PII redaction from parent", () => {
    const { stream, getLogs } = createTestStream();
    const logger = makeLogger(undefined, stream);
    const child = logger.child({ requestId: "x" });
    child.info({ email: "a@b.com" }, "msg");
    const [entry] = getLogs();
    expect(entry["email"]).toBe("[REDACTED]");
    expect(entry["requestId"]).toBe("x");
  });

  it("child debug does not redact PII", () => {
    const { stream, getLogs } = createTestStream();
    const logger = makeLogger({ level: "debug" }, stream);
    const child = logger.child({ requestId: "y" });
    child.debug({ email: "a@b.com" }, "msg");
    const [entry] = getLogs();
    expect(entry["email"]).toBe("a@b.com");
  });
});
