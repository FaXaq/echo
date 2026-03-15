import type pino from "pino";

export interface LoggerOptions {
  name?: string;
  level?: "trace" | "debug" | "info" | "warn" | "error" | "fatal";
  context?: Record<string, unknown>;
  env?: "production" | "development";
  logLevel?: pino.Level;
  serializers?: pino.LoggerOptions["serializers"];
}

export interface Logger {
  debug(obj: unknown, msg?: string): void;
  debug(msg: string): void;
  info(obj: unknown, msg?: string): void;
  info(msg: string): void;
  warn(obj: unknown, msg?: string): void;
  warn(msg: string): void;
  error(obj: unknown, msg?: string): void;
  error(msg: string): void;
  fatal(obj: unknown, msg?: string): void;
  fatal(msg: string): void;
  child(bindings: Record<string, unknown>): Logger;
}
