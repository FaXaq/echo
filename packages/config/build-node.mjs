#!/usr/bin/env node
import { readFileSync } from "node:fs";
import { isBuiltin } from "node:module";
import { build } from "esbuild";

const [entry, outfile] = process.argv.slice(2);
const { dependencies = {} } = JSON.parse(readFileSync("package.json", "utf8"));
const missing = new Set();

const packageName = (path) => path.split("/").slice(0, path.startsWith("@") ? 2 : 1).join("/");

await build({
  entryPoints: [entry],
  outfile,
  bundle: true,
  platform: "node",
  format: "esm",
  target: "node24",
  sourcemap: true,
  logLevel: "info",
  plugins: [
    {
      name: "external-non-workspace",
      setup(build) {
        build.onResolve({ filter: /^[^./]/ }, (args) => {
          if (args.path.startsWith("@echo/")) return;
          const name = packageName(args.path);
          if (!isBuiltin(args.path) && !(name in dependencies)) missing.add(name);
          return { path: args.path, external: true };
        });
      },
    },
  ],
});

if (missing.size > 0) {
  throw new Error(
    `External imports not listed in package.json dependencies (they won't resolve at runtime): ${[...missing].join(", ")}`,
  );
}
