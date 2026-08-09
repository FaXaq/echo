import pino from "pino";
import { sanitize } from "./sanitize";
import type { Logger, LoggerOptions } from "./types";

type PinoLogger = pino.Logger;

function resolveLevel(options?: LoggerOptions): pino.Level {
  if (options?.level) return options.level;
  if (options?.logLevel) return options?.logLevel as pino.Level;
  return options?.env === "production" ? "info" : "debug";
}

function wrapLogger(pinoLogger: PinoLogger): Logger {
  function logWithSanitize(
    level: "info" | "warn" | "error" | "fatal",
    objOrMsg: unknown,
    msg?: string,
  ): void {
    if (typeof objOrMsg === "string") {
      pinoLogger[level](objOrMsg);
    } else {
      pinoLogger[level](sanitize(objOrMsg) as object, msg);
    }
  }

  return {
    debug(objOrMsg: unknown, msg?: string): void {
      if (typeof objOrMsg === "string") {
        pinoLogger.debug(objOrMsg);
      } else {
        pinoLogger.debug(objOrMsg, msg);
      }
    },
    info(objOrMsg: unknown, msg?: string): void {
      logWithSanitize("info", objOrMsg, msg);
    },
    warn(objOrMsg: unknown, msg?: string): void {
      logWithSanitize("warn", objOrMsg, msg);
    },
    error(objOrMsg: unknown, msg?: string): void {
      logWithSanitize("error", objOrMsg, msg);
    },
    fatal(objOrMsg: unknown, msg?: string): void {
      logWithSanitize("fatal", objOrMsg, msg);
    },
    child(bindings: Record<string, unknown>): Logger {
      return wrapLogger(pinoLogger.child(bindings));
    },
  };
}

export function makeLogger(options?: LoggerOptions): Logger;
export function makeLogger(
  options: LoggerOptions | undefined,
  stream: pino.DestinationStream,
): Logger;
export function makeLogger(options?: LoggerOptions, stream?: pino.DestinationStream): Logger {
  const level = resolveLevel(options);
  const pinoOptions: pino.LoggerOptions = {
    level,
    timestamp: pino.stdTimeFunctions.isoTime,
    serializers: options?.serializers,
    browser: {
      asObject: true,
      write: {
        trace: (obj) => console.debug("[TRACE]", obj),
        debug: (obj) => console.debug("[DEBUG]", obj),
        info: (obj) => console.info("[INFO] ", obj),
        warn: (obj) => console.warn("[WARN] ", obj),
        error: (obj) => console.error("[ERROR]", obj),
        fatal: (obj) => console.error("[FATAL]", obj),
      },
    },
  };

  let pinoInstance: PinoLogger;
  if (stream) {
    pinoInstance = pino(pinoOptions, stream);
  } else {
    pinoInstance = pino(pinoOptions);
  }

  if (options?.name || options?.context) {
    const bindings: Record<string, unknown> = {};
    if (options.name) bindings["name"] = options.name;
    if (options.context) Object.assign(bindings, options.context);
    pinoInstance = pinoInstance.child(bindings);
  }

  return wrapLogger(pinoInstance);
}
