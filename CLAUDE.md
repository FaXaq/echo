# CLAUDE.md

Strictly follow all rules and guidelines in `./AGENTS.md`

@AGENTS.md

## Active Technologies
- TypeScript 5.x + React 18, Tone.js v15, @tonejs/midi v2, soundfont-player v0.12, audiobuffer-to-wav, midi-instrument, TanStack Router, tRPC, Fastify, Kysely, PostgreSQL (001-daw-enhancements)
- PostgreSQL — `track.volume` column type changes to FLOAT; new `midi_clip` table; new `track.instrument_preset` column (001-daw-enhancements)
- TypeScript 5.x, React 18 + Tailwind CSS v4, existing tRPC client hooks, Tone.js (unchanged) (002-dnd-file-to-track)
- TypeScript 5.x + React 18 + Tone.js v15, @tonejs/midi v2, tRPC, Kysely, Fastify, Tailwind CSS v4, shadcn/ui (003-daw-advanced-editing)
- PostgreSQL via Kysely (no schema changes — existing `order`, `track_id` columns used) (003-daw-advanced-editing)
- TypeScript 5.x + React 18 + React Context API, tRPC client hooks, Tone.js v15, @tonejs/midi v2, TanStack Router, Tailwind CSS v4, shadcn/ui (004-daw-refactor)
- N/A (pure frontend refactoring — no persistence changes) (004-daw-refactor)


## Recent Changes
- 001-daw-enhancements: Added TypeScript 5.x + React 18, Tone.js v15, @tonejs/midi v2, soundfont-player v0.12, audiobuffer-to-wav, midi-instrument, TanStack Router, tRPC, Fastify, Kysely, PostgreSQL
