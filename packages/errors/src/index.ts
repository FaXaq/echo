import type { ZodError } from "zod";

export abstract class AppError extends Error {
  abstract readonly type: string;
}

export class NotFoundError extends AppError {
  readonly type = "NOT_FOUND" as const;
  readonly entity: string;
  constructor(entity: string) {
    super(`${entity} not found`);
    this.name = "NotFoundError";
    this.entity = entity;
  }
}

export class ConflictError extends AppError {
  readonly type = "CONFLICT" as const;
  constructor(message: string) {
    super(message);
    this.name = "ConflictError";
  }
}

export class DataValidationFailedError extends AppError {
  readonly type = "DATA_VALIDATION_FAILED" as const;
  readonly validationsFailed: ZodError[];
  readonly entity: string;
  constructor(validationsFailed: ZodError[], entity: string) {
    super(`Data validation failed for ${entity}`);
    this.name = "DataValidationFailedError";
    this.validationsFailed = validationsFailed;
    this.entity = entity;
  }
}

export class DatabaseError extends AppError {
  readonly type = "DATABASE_ERROR" as const;
  constructor(message: string) {
    super(message);
    this.name = "DatabaseError";
  }
}

export class UnauthorizedError extends AppError {
  readonly type = "UNAUTHORIZED" as const;
  constructor(message: string) {
    super(message);
    this.name = "UnauthorizedError";
  }
}

export class ForbiddenError extends AppError {
  readonly type = "FORBIDDEN" as const;
  readonly entity: string;
  readonly action: string;
  constructor(entity: string, action: string) {
    super(`Forbidden: ${action} on ${entity}`);
    this.name = "ForbiddenError";
    this.entity = entity;
    this.action = action;
  }
}

export class UnknownError extends AppError {
  readonly type = "UNKNOWN" as const;
  constructor(message?: string) {
    super(message ?? "");
    this.name = "UnknownError";
  }
}

export const notFound = (entity: string) => new NotFoundError(entity);
export const conflict = (message: string) => new ConflictError(message);
export const dataValidationFailed = (validationsFailed: ZodError[], entity: string) =>
  new DataValidationFailedError(validationsFailed, entity);
export const dbError = (message: string) => new DatabaseError(message);
export const unauthorized = (message: string) => new UnauthorizedError(message);
export const forbidden = ({ entity, action }: { entity: string; action: string }) =>
  new ForbiddenError(entity, action);
export const unknownError = (message?: string) => new UnknownError(message);
