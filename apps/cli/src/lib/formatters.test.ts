import { describe, it, expect } from "vitest";
import { formatJson, formatTable, formatCsv } from "./formatters";

describe("formatJson", () => {
  it("formats data as indented JSON", () => {
    const result = formatJson({ a: 1, b: "hello" });
    expect(JSON.parse(result)).toEqual({ a: 1, b: "hello" });
    expect(result).toContain("\n"); // indented
  });
});

describe("formatTable", () => {
  it("returns (no results) for empty array", () => {
    expect(formatTable([])).toBe("(no results)");
  });

  it("formats rows as aligned table", () => {
    const rows = [
      { id: "1", name: "Alice" },
      { id: "2", name: "Bob" },
    ];
    const result = formatTable(rows);
    const lines = result.split("\n");

    expect(lines).toHaveLength(4); // header + separator + 2 rows
    expect(lines[0]).toContain("id");
    expect(lines[0]).toContain("name");
    expect(lines[1]).toMatch(/^-+/); // separator
    expect(lines[2]).toContain("Alice");
    expect(lines[3]).toContain("Bob");
  });

  it("pads columns to longest value", () => {
    const rows = [{ name: "Al" }, { name: "Alexander" }];
    const result = formatTable(rows);
    const lines = result.split("\n");

    // Separator should match length of longest value
    expect(lines[1]!.length).toBeGreaterThanOrEqual(9);
    // "Al" row should be padded
    expect(lines[2]).toContain("Al");
  });
});

describe("formatCsv", () => {
  it("returns empty string for empty array", () => {
    expect(formatCsv([])).toBe("");
  });

  it("formats rows as CSV with header", () => {
    const rows = [
      { id: "1", name: "Alice" },
      { id: "2", name: "Bob" },
    ];
    const result = formatCsv(rows);
    const lines = result.split("\n");

    expect(lines).toHaveLength(3); // header + 2 rows
    expect(lines[0]).toBe("id,name");
    expect(lines[1]).toBe("1,Alice");
    expect(lines[2]).toBe("2,Bob");
  });

  it("escapes values containing commas", () => {
    const rows = [{ name: "Doe, John" }];
    const result = formatCsv(rows);
    expect(result).toContain('"Doe, John"');
  });

  it("escapes values containing double quotes", () => {
    const rows = [{ name: 'Say "hi"' }];
    const result = formatCsv(rows);
    expect(result).toContain('"Say ""hi"""');
  });

  it("handles null/undefined values", () => {
    const rows = [{ a: null, b: undefined }];
    const result = formatCsv(rows);
    const lines = result.split("\n");
    expect(lines[1]).toBe(",");
  });
});
