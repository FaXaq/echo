import Fastify, { type FastifyBaseLogger } from "fastify";
import cors from "@fastify/cors";
import {
  fastifyTRPCPlugin,
  type FastifyTRPCPluginOptions,
} from "@trpc/server/adapters/fastify";
import { makeLogger, stdSerializers } from "@echo/logger";
import { makeAppRouter, type AppRouter } from "./router/index";
import { appConfig } from "./adapters/config/index";
import { makeAuthRoute } from "./adapters/auth/route";
import auth from "./adapters/auth/auth";
import { makeCreateContext } from "./context";

// Build router at composition root
const appRouter = makeAppRouter();

function toFastifyLogger(
  base: ReturnType<typeof makeLogger>,
): FastifyBaseLogger {
  const adapted: FastifyBaseLogger = {
    ...base,
    level: "info",
    trace: (obj: unknown, msg?: string) => base.debug(obj as object, msg),
    silent: () => {},
    child: (bindings) => toFastifyLogger(base.child(bindings)),
  };
  return adapted;
}

const loggerInstance = toFastifyLogger(
  makeLogger({
    name: "api",
    serializers: {
      req: stdSerializers.req,
      res: stdSerializers.res,
      err: stdSerializers.err,
    },
  }),
);

const server = Fastify({ loggerInstance });

await server.register(cors, {
  origin: appConfig.auth.trustedOrigins ?? true,
  credentials: true,
});

server.get("/health", () => ({ status: "ok" }));

// register auth route
makeAuthRoute(server);

await server.register(fastifyTRPCPlugin, {
  prefix: "/trpc",
  trpcOptions: {
    router: appRouter,
    createContext: makeCreateContext(auth),
  } satisfies FastifyTRPCPluginOptions<AppRouter>["trpcOptions"],
});

await server.listen({
  port: appConfig.server.port,
  host: appConfig.server.host,
});
