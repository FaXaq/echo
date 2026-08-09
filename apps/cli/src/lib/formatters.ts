type Row = Record<string, unknown>;

export const formatJson = (data: unknown): string => JSON.stringify(data, null, 2);

export const formatTable = (rows: Row[]): string => {
  if (rows.length === 0) return "(no results)";

  const keys = Object.keys(rows[0]!);
  const widths = keys.map((k) => Math.max(k.length, ...rows.map((r) => String(r[k] ?? "").length)));

  const header = keys.map((k, i) => k.padEnd(widths[i]!)).join("  ");
  const separator = widths.map((w) => "-".repeat(w)).join("  ");
  const body = rows
    .map((r) => keys.map((k, i) => String(r[k] ?? "").padEnd(widths[i]!)).join("  "))
    .join("\n");

  return `${header}\n${separator}\n${body}`;
};

export const formatCsv = (rows: Row[]): string => {
  if (rows.length === 0) return "";

  const keys = Object.keys(rows[0]!);
  const escape = (v: unknown): string => {
    const s = String(v ?? "");
    return s.includes(",") || s.includes('"') || s.includes("\n")
      ? `"${s.replace(/"/g, '""')}"`
      : s;
  };

  const header = keys.map(escape).join(",");
  const body = rows.map((r) => keys.map((k) => escape(r[k])).join(",")).join("\n");

  return `${header}\n${body}`;
};

export const printOutput = (
  data: Row | Row[],
  format: "json" | "table" | "csv" = "table",
): void => {
  const rows = Array.isArray(data) ? data : [data];

  switch (format) {
    case "json":
      console.log(formatJson(rows));
      break;
    case "csv":
      console.log(formatCsv(rows));
      break;
    case "table":
      console.log(formatTable(rows));
      break;
  }
};
