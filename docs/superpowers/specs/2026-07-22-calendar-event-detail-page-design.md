# Calendar event detail page

## Problem

Calendar events (both personal and organization) currently have no page of
their own. Clicking an event on the calendar grid opens an edit dialog
directly — there's no way to view or link to a single event.

## Goals

- Clicking an event navigates to a dedicated detail page for that event,
  replacing the current click-opens-edit-dialog behavior.
- The detail page is read-only, with an **Edit** action that opens the
  existing edit dialog, and its own **Delete** action.
- Works for both personal events and organization events.

## Non-goals

- Unifying personal and organization calendars under a single "me"
  organization concept. Raised during design as a possible future
  simplification (would collapse the two parallel route/query trees into
  one), but it's a separate architectural change (auto-created org on
  signup, org switcher, RBAC scoping, backend endpoint consolidation) and
  is out of scope here.
- Adding a dedicated `getEventById` backend endpoint. The detail page reuses
  the existing list query (`listUserEvents` / `listOrganizationEvents`),
  which is already fetched and cached for the calendar grid, and finds the
  event by id client-side.
- Fixing up the four existing flows that redirect to `/` (switching to
  "Personal" context, accepting an org invitation, resetting password,
  organization-not-found guard). The personal calendar is moving off `/` to
  `/calendar` as part of this change, and those flows will land on `/` with
  nothing rendered there afterward. Explicitly accepted as follow-up debt.

## Design

### 1. `EventCalendar` click behavior

`apps/web/src/components/ui/event-calendar/event-calendar.tsx`

`requestEventClick` currently both opens the edit dialog and calls
`onEventClick`. It changes to only call `onEventClick?.(event)` — the
dialog no longer opens automatically on click. Event creation (drag-select
on the grid → create dialog, "New event" button) is unchanged. Because
`EventCard` in the day-overflow popover (`DayEventsDialog`) goes through
the same `requestEventClick` context callback, clicking an event there also
navigates to the detail page — consistent with clicking anywhere else on
the grid.

`onEventClick` becomes the primary way callers react to a click; both
calendar pages (personal and org) will pass a handler that navigates to the
new detail route.

### 2. Shared presentational component: `EventDetail`

New file `apps/web/src/components/ui/event-calendar/event-detail.tsx`,
exported from `apps/web/src/components/ui/event-calendar/index.ts`, with a
co-located `event-detail.stories.tsx` (per the UI component rules in
AGENTS.md — every component needs a Storybook file).

Purely presentational, no data fetching or routing:

```ts
interface EventDetailProps {
  event: CalendarEvent
  onEdit: () => void
  onDelete: () => void
  onBack: () => void
}
```

Renders title, description, formatted start/end (all-day aware), the
event's color, and Back / Edit / Delete actions. Delete opens its own
confirm `AlertDialog`, mirroring the delete confirmation already built into
`EventDialog`.

### 3. New detail routes

- `apps/web/src/routes/calendar/$eventId.tsx` (personal). Uses
  `getUserEventsQueryOptions()` (same query/cache as the calendar grid),
  finds the event by the `eventId` route param client-side. Renders
  `EventDetail`. `onEdit` opens a locally-owned `EventDialog` (imported from
  `@/ui/event-calendar`) in edit mode; submitting calls `updateUserEvent`.
  `onDelete` calls `deleteUserEvent` then navigates to `/calendar`. `onBack`
  navigates to `/calendar`. If the id isn't found in the list (stale link,
  deleted event), renders a simple "Event not found" state instead.
- `apps/web/src/routes/organizations/$organizationSlug/calendar/$eventId.tsx`
  (organization). Same shape, using `getOrganizationEventsQueryOptions`,
  `updateOrganizationEvent`, `deleteOrganizationEvent`, and navigating back
  to `/organizations/$organizationSlug/calendar`.

Both routes need `EventDialog` and `EventDialogState` exported from
`apps/web/src/components/ui/event-calendar/index.ts` (currently
internal-only to `event-calendar.tsx`).

### 4. Moving the personal calendar grid

The content of `apps/web/src/routes/index.tsx` (the `HomePage` component)
moves to `apps/web/src/routes/calendar/index.tsx`. Its `onEventClick` is
added, navigating to `/calendar/$eventId` with the clicked event's id.
`apps/web/src/routes/index.tsx` is removed.

`apps/web/src/routes/organizations/$organizationSlug/calendar/index.tsx`
gets the same `onEventClick` addition, navigating to the sibling
`/organizations/$organizationSlug/calendar/$eventId` route.

### 5. Navigation

`apps/web/src/hooks/use-navigation.ts`: add a `Calendar` item to
`personalNavGroups` pointing at `/calendar`. Today there's no personal
"Calendar" nav entry (the page lived at `/`, reached via other means); once
it moves, it needs a reachable entry point from the sidebar, matching the
existing org `Calendar` nav item.

### 6. Tests

`apps/web/src/components/ui/event-calendar/event-calendar.test.tsx`:

- `"calls onEventClick and opens the edit dialog when an event is clicked"`
  is rewritten to assert only that `onEventClick` fires — no dialog is
  expected to open anymore.
- `"deletes an event after confirming in the alert dialog"` (which currently
  drives delete through the click-opened edit dialog) is removed from this
  file; equivalent delete-confirmation coverage moves to a new
  `event-detail.test.tsx` alongside the new component, since delete now
  lives on the detail page.

## Open questions

None outstanding — all resolved during design discussion.
