#!/bin/sh
# With args: run the CLI (used by CD for one-off `db migrate` / `db migrate-down`).
# Without args: idle forever, so the container stays up as a Coolify resource
# you can exec/SSH into and run ad-hoc `echo <command>` invocations against.
if [ "$#" -eq 0 ]; then
  exec sleep infinity
else
  exec node dist/main.js "$@"
fi
