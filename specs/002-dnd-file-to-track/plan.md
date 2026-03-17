# Implementation Plan: Drag & Drop Files to Timeline Tracks

**Branch**: `002-dnd-file-to-track` | **Date**: 2026-03-16 | **Spec**: [spec.md](spec.md)

## Summary

Add native HTML5 drag-and-drop support to the DAW timeline so users can drag audio/MIDI files from their OS directly onto a track lane. During the drag, a ghost clip snaps to the 1/4-measure grid on the target track as a live preview. On drop, the existing `handleUploadAudio` / `handleUploadMidi` functions are called with the resolved track ID and measure. **No backend changes are required** — this is a pure frontend addition to `-timeline.tsx`.

## Technical Context

**Language/Version**: TypeScript 5.x, React 18
**Primary Dependencies**: Tailwind CSS v4, existing tRPC client hooks, Tone.js (unchanged)
**Storage**: N/A (no schema changes)
**Testing**: Vitest + React Testing Library
**Target Platform**: Web browser (modern Chromium/Firefox/Safari with HTML5 DnD API)
**Project Type**: Web application (React SPA)
**Performance Goals**: Ghost clip position updates at 60 fps (`dragover` fires ~60×/s; computation is O(1))
**Constraints**: Must not interfere with active playback; left panel must not accept drops
**Scale/Scope**: Single component change (`-timeline.tsx`)

## Constitution Check

The project constitution file is a blank template — no project-specific gates are defined. No violations to track.

## Project Structure

### Documentation (this feature)

```text
specs/002-dnd-file-to-track/
├── plan.md              ← this file
├── research.md          ← Phase 0 decisions
├── data-model.md        ← transient state types + existing entities
├── contracts/
│   └── timeline-drag-drop.md   ← UI component contract
└── tasks.md             ← Phase 2 output (not yet created)
```

### Source Code (only file modified)

```text
apps/web/src/routes/_auth-guard/organizations/$organizationSlug/songs/$songSlug/daw/
└── -timeline.tsx        ← ONLY file changed
```
