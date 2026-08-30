#!/usr/bin/env node
import { build } from "esbuild";

const [entry, outfile] = process.argv.slice(2);

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
          return { path: args.path, external: true };
        });
      },
    },
  ],
});
