import { dataValidationFailed } from "@echo/errors";
import { ZodError } from "zod";

export const invalidLedgerEntry = (entity: "Expense" | "Repayment", message: string) =>
  dataValidationFailed([new ZodError([{ code: "custom", message, path: [] }])], entity);
