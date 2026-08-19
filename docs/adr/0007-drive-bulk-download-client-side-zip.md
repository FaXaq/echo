# Drive bulk download: client-side zip, not server-side streaming

ECH-65 adds bulk/group file download to Drive. Three options were considered: fan out N separate browser downloads, zip client-side (fetch each file's blob, bundle with `fflate`, download one `.zip`), or stream a server-built zip from S3 objects. We chose client-side zip, capped at 100 files or 300MB per selection (whichever hits first — Download disables past that with an explanatory tooltip).

This is a deliberate POC-stage trade-off, not a technical dead end: no server infrastructure (job queue, streaming zip writer, batch S3 read) exists yet for this, and building it wasn't justified before the feature had proven demand. Fan-out was rejected because multiple simultaneous download-triggered clicks are unreliable across browsers, and users expect "download selection" to produce one file.

## Consequences

The 100-file/300MB guard-rail is a hard UX ceiling until a v2 backend exists — large selections simply can't be downloaded, disabled with a tooltip rather than degraded gracefully. Moving to server-side streaming later is additive, not a rework: swap the client-side fetch+zip step for a call to an endpoint returning one presigned zip URL, drop the guard-rail. The frontend contract (Download button → one file lands) is unchanged either way.
