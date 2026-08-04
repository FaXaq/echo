# Add a place/address to events

## Problem

Events (`calendar_event`) currently have no notion of where they happen. Users want to attach a venue/address to an event, searched via autocomplete rather than typed freehand, so the stored location is unambiguous and can be opened in a maps app.

## Target state

- Creating/editing an event lets the user search for a place by typing (name or address); results come from Mapbox and are shown as a dropdown of suggestions.
- Picking a suggestion attaches that place (name, formatted address, coordinates) to the event. The field is optional — an event can have no place.
- Viewing an event shows the place as text (name + address) with an "Open in Maps" link. No embedded map.
- Geocoding/search is proxied through the backend (not called from the browser), via a new shared `GeocodingPort`, so the Mapbox secret token never reaches the client and the capability is reusable outside the calendar module.

## Data model

New nullable columns on `calendar_event` (migration in `packages/db/migrations/`):

| column | type |
|---|---|
| `place_name` | `text` |
| `place_address` | `text` |
| `place_lat` | `double precision` |
| `place_lng` | `double precision` |

All four are set together or all left null — no partial state. No separate `place` table: a place has no identity or lifecycle independent of the event that references it (unlike attachments, which are their own entities), so inline columns match the existing `color`/`title` fields rather than the file/attachment pattern.

`CalendarEvent` domain type (`packages/modules/src/calendar/domain/index.ts`) gains:

```ts
export type EventPlace = {
  name: string;
  address: string;
  lat: number;
  lng: number;
};

export type CalendarEvent = {
  // ...existing fields
  place: EventPlace | null;
};
```

Same shape is mirrored in the frontend `CalendarEvent` type (`apps/web/src/components/ui/event-calendar/types.ts`).

## Backend

### Shared adapter: `packages/adapters/src/geocoding/`

Following the existing `mailer` / `s3-storage` pattern (not the module-local `infrastructure/*.port.ts` pattern, since this is a reusable external capability, not calendar-specific):

- `geocoding.port.ts`
  ```ts
  export type GeocodedPlace = { name: string; address: string; lat: number; lng: number };
  export interface GeocodingPort {
    searchPlaces: (query: string) => Promise<GeocodedPlace[]>;
  }
  ```
- `geocoding.mapbox.ts` — `makeGeocoding(config: { accessToken: string }): GeocodingPort`, calling Mapbox's Search Box API (`GET /search/searchbox/v1/suggest` + `/retrieve`, or the equivalent single-call geocoding endpoint that returns coordinates directly — confirmed at implementation time). Empty/whitespace query returns `[]` without calling out.
- `index.ts` — barrel, matching `s3-storage/index.ts`.
- `package.json` `exports` gains `"./geocoding"`.

### Config wiring

- `apps/api/src/adapters/config/env.ts` — add `MAPBOX_ACCESS_TOKEN: z.string().min(1)`.
- `apps/api/src/adapters/config/index.ts` — add `mapbox: { accessToken: env.MAPBOX_ACCESS_TOKEN }` to `appConfig`.
- `apps/api/src/context.ts` — `const geocoding = makeGeocoding(appConfig.mapbox)` (module-level singleton, same as `mailer`), added to the returned `Context`.
- `apps/api/src/trpc.ts` — `Context` type gains `geocoding: GeocodingPort`.

### Calendar app layer

- `packages/modules/src/calendar/app/search-places.ts`:
  ```ts
  export async function searchPlaces(
    deps: { geocoding: GeocodingPort },
    input: { query: string },
  ) {
    return deps.geocoding.searchPlaces(input.query);
  }
  ```
  Thin pass-through, kept as a use case (not called directly from the router) to stay consistent with "procedures call use cases from `@echo/app`". No auth/permission check beyond `authedProcedure` — search results aren't scoped to an organization or sensitive.
- Exported from `calendar/app/index.ts`.
- `createEvent` / `updateEvent` use cases gain an optional `place` field on their input, passed straight through to `insertCalendarEvent` / `updateCalendarEvent` (`calendar/infrastructure/`). No validation beyond what zod does at the router boundary (lat/lng ranges) — the use case trusts the caller since the place always originates from a prior `searchPlaces` result, never freehand input.

### Router (`apps/api/src/router/calendar.ts`)

- `searchPlaces: authedProcedure.input(z.object({ query: z.string().min(1) })).query(...)`.
- `eventInput` gains:
  ```ts
  place: z.object({
    name: z.string().min(1),
    address: z.string().min(1),
    lat: z.number().min(-90).max(90),
    lng: z.number().min(-180).max(180),
  }).nullable().optional(),
  ```
  applied to both `createEvent` and `updateEvent`.

### Infrastructure (`calendar/infrastructure/`)

- `insert-calendar-event.ts`, `update-calendar-event.ts`, `map-calendar-event.ts` — extended to read/write the four new columns, mapping `place_*` columns to/from the nested `place` object (null columns → `place: null`).

## Frontend

### `apps/web/src/services/resources/calendar.ts`

- `useSearchPlacesQuery` (or a plain debounced-fetch hook) wrapping `apiClient.calendar.searchPlaces.query`. Given free-text search-as-you-type, this is called imperatively/debounced from the combobox component rather than as a standing `useQuery` subscription — exact hook shape decided during implementation.
- `CreateEventInput` / `UpdateEventInput` types pick up `place` automatically via `RouterInputs`.

### `EventDialog` (`apps/web/src/components/ui/event-calendar/event-dialog.tsx`)

- New `PlaceField` sub-component (co-located, e.g. `-place-field.tsx` if it grows, or inline if small): a text input that, on debounced change, calls `searchPlaces` and renders a dropdown (built on existing `Popover`/`Command` primitives — confirm availability under `@/ui` at implementation time, otherwise a plain absolutely-positioned list matching existing dropdown styling) of `name` + `address` suggestions. Selecting one stores the full `EventPlace` in form state (via `Controller`, since it's a non-native-input value) and shows it as the field's display value with a clear ("x") affordance. Clearing sets the field back to `null`.
- `eventFormSchema` gains `place: placeSchema.nullable()` (same shape as the router's, minus server-side trust concerns).
- `stateToDefaultValues` / `submit` pass `place` through alongside the other fields.

### `EventDetail` (`apps/web/src/components/ui/event-calendar/event-detail.tsx`)

- When `event.place` is set, render name + address as text, with an anchor `href={`https://www.google.com/maps/search/?api=1&query=${lat},${lng}`}` `target="_blank" rel="noreferrer"` labeled "Open in Maps", placed near the date block.

## Error handling

- Mapbox request failures in `makeGeocoding` (network error, non-2xx) are caught in the adapter and re-thrown via `unknownError(message)` from `@echo/errors`, per the project's rule that adapters never let raw errors cross their boundary. This reaches the tRPC boundary through `search-places.ts` unchanged and is converted by the existing `appErrorToTRPC` catch-all (`UNKNOWN` → `INTERNAL_SERVER_ERROR`) — no new error type or `case` needed in `apps/api/src/lib/errors.ts`.
- On the frontend, a failed search leaves the dropdown empty (no results) rather than surfacing a hard error, so the user can keep typing or retry.
- No results for a query → empty dropdown, no error state.

## Testing

- `packages/adapters/src/geocoding/` — unit test `makeGeocoding` against a mocked `fetch`, covering a successful search and an empty-query short-circuit.
- `packages/modules/src/calendar/app/search-places.test.ts` — trivial pass-through test with a fake `GeocodingPort`.
- `createEvent`/`updateEvent` app tests — extend existing fakes to cover round-tripping `place` (set, null, omitted).
- `apps/web/.../event-dialog.test.tsx` (if one exists at implementation time, else new) — combobox search + select + clear, mocking the `searchPlaces` query.
- `event-detail.test.tsx` — extend to cover the "Open in Maps" link rendering when `place` is set and absence when `null`.
- Storybook: `event-dialog.stories.tsx` / `event-detail.stories.tsx` — add a variant with a place set, mocking the search endpoint per existing MSW/story conventions.

## Out of scope

- No embedded/static map image (text + link only, per earlier decision).
- No editing place components after selection (e.g. tweaking just the address text) — clear and re-search instead.
- No backfill/migration of existing events (they simply have `place: null`).
- No reverse-geocoding (map click → address) or "use my current location" — search-by-text only.
