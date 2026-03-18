# tRPC Endpoint Contracts: DAW Advanced Editing

**Branch**: `003-daw-advanced-editing` | **Date**: 2026-03-17

---

## Modified Endpoints

### `audioClip.updatePosition`

**Router**: `apps/api/src/router/organizations/audio-clip.ts`
**Procedure type**: `authedProcedure` (unchanged)

**Input (extended)**:
```typescript
z.object({
  id: z.string().min(1),
  startMeasure: z.number().min(1),
  trackId: z.string().optional(),   // NEW — if provided, clip moves to this track
})
```

**Output**: Updated `AudioClip` domain object.

**Behaviour change**: When `trackId` is provided, the use case must verify the target track belongs to the same song as the clip before updating. Throws `ForbiddenError` otherwise.

---

### `midiClip.updatePosition`

**Router**: `apps/api/src/router/organizations/midi-clip.ts`
**Procedure type**: `authedProcedure` (unchanged)

**Input (extended)**:
```typescript
z.object({
  id: z.string().min(1),
  startMeasure: z.number().min(1),
  trackId: z.string().optional(),   // NEW — same semantics as audio-clip
})
```

**Output**: Updated `MidiClip` domain object.

---

## New Endpoints

### `track.reorder`

**Router**: `apps/api/src/router/organizations/track.ts`
**Procedure type**: `authedProcedure`

**Input**:
```typescript
z.object({
  songId: z.string().min(1),
  orderedTrackIds: z.array(z.string()).min(1),
})
```

**Output**: `void`

**Behaviour**:
1. Verify all `orderedTrackIds` belong to the given `songId`; throw `ForbiddenError` on mismatch.
2. Verify no IDs are duplicated; throw `DataValidationFailedError` on duplicates.
3. In a single DB transaction, `UPDATE track SET order = $index WHERE id = $id` for each entry.

**Error codes**:
- `FORBIDDEN` — track belongs to a different song or caller lacks access.
- `BAD_REQUEST` — duplicate IDs or IDs not matching song's track list.
