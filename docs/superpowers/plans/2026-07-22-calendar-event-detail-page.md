# Calendar Event Detail Page Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Give every calendar event its own detail page (read-only view + Edit/Delete actions) for both personal and organization calendars, reachable by clicking an event anywhere on the calendar grid.

**Architecture:** `EventCalendar` stops opening its edit dialog automatically on click and instead only calls `onEventClick`. Two new routes (`/calendar/$eventId` and `/organizations/$organizationSlug/calendar/$eventId`) render a new presentational `EventDetail` component, sourcing data from the already-cached list queries (no new backend endpoint). Editing on the detail page reuses the existing `EventDialog` component as a modal. The personal calendar grid moves from `/` to `/calendar` so both calendars follow the same `<calendar-root>/$eventId` URL shape.

**Tech Stack:** TypeScript 5.x, React 18, TanStack Router (file-based routing, `@tanstack/router-plugin` for codegen), TanStack Query, react-i18next, Tailwind v4, Vitest + Testing Library, dayjs.

## Global Constraints

- Every user-visible string must go through `t()`/`<Trans>` and have an entry in both `packages/i18n/locales/en.json` and `packages/i18n/locales/fr.json`, under the correct namespace (`calendar` for calendar-scoped text, `navigation` for sidebar/breadcrumb labels).
- Every UI component under `apps/web/src/components/ui/` needs a co-located `*.stories.tsx`.
- Route files must stay thin; extract non-route helpers only when reused across routes (this plan reuses `EventDetail` and `EventDialog` from the shared `event-calendar` component folder rather than duplicating logic).
- Follow the existing quote-style convention of whichever file/folder you're editing (org calendar route files use single quotes, personal calendar route files use double quotes) rather than reformatting whole files.

---

### Task 1: Stop `EventCalendar` from auto-opening the edit dialog on click

**Files:**
- Modify: `apps/web/src/components/ui/event-calendar/event-calendar.tsx:101-122`
- Test: `apps/web/src/components/ui/event-calendar/event-calendar.test.tsx:57-107`

**Interfaces:**
- Consumes: existing `EventCalendarProps.onEventClick?: (event: CalendarEvent) => void` (unchanged signature).
- Produces: clicking an event (via `EventCard` or `EventBlock`, both already wired to `useCalendarContext().requestEventClick`) now **only** calls `onEventClick` — no dialog opens. Later tasks rely on this: the calendar pages will pass `onEventClick` handlers that navigate to the new detail routes.

- [ ] **Step 1: Update the click test to expect no dialog and remove the now-impossible delete-via-click test**

Replace the two tests in `apps/web/src/components/ui/event-calendar/event-calendar.test.tsx` (lines 57-107, from `it("calls onEventClick and opens the edit dialog when an event is clicked"...)` through the end of `it("deletes an event after confirming in the alert dialog"...)`) with:

```tsx
  it("calls onEventClick and does not open a dialog when an event is clicked", async () => {
    const user = userEvent.setup()
    const onEventClick = vi.fn()
    const event = makeEvent()
    render(<EventCalendar events={[event]} onEventClick={onEventClick} />)

    await user.click(screen.getByText("Standup"))

    expect(onEventClick).toHaveBeenCalledWith(event)
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument()
  })
```

- [ ] **Step 2: Run the test to verify it fails**

Run: `pnpm --filter @echo/web exec vitest run src/components/ui/event-calendar/event-calendar.test.tsx -t "does not open a dialog"`
Expected: FAIL — `screen.queryByRole("dialog")` finds the edit dialog, because the current code still opens it on click.

- [ ] **Step 3: Remove the auto-open-dialog line from `requestEventClick`**

In `apps/web/src/components/ui/event-calendar/event-calendar.tsx`, change:

```tsx
      requestEventClick: (event) => {
        setDayOverflow(null)
        setDialogState({ mode: "edit", event })
        onEventClick?.(event)
      },
```

to:

```tsx
      requestEventClick: (event) => {
        setDayOverflow(null)
        onEventClick?.(event)
      },
```

- [ ] **Step 4: Run the full test file to verify it passes**

Run: `pnpm --filter @echo/web exec vitest run src/components/ui/event-calendar/event-calendar.test.tsx`
Expected: PASS — all remaining tests in the file succeed (the "validates and creates a new event" test is unaffected since creation still uses the dialog).

- [ ] **Step 5: Commit**

```bash
git add apps/web/src/components/ui/event-calendar/event-calendar.tsx apps/web/src/components/ui/event-calendar/event-calendar.test.tsx
git commit -m "fix: stop calendar events from opening the edit dialog on click"
```

---

### Task 2: Build the `EventDetail` presentational component

**Files:**
- Modify: `apps/web/src/components/ui/event-calendar/colors.ts`
- Modify: `apps/web/src/components/ui/event-calendar/event-dialog.tsx:72-79`
- Modify: `apps/web/src/components/ui/event-calendar/index.ts`
- Create: `apps/web/src/components/ui/event-calendar/event-detail.tsx`
- Create: `apps/web/src/components/ui/event-calendar/event-detail.stories.tsx`
- Test: `apps/web/src/components/ui/event-calendar/event-detail.test.tsx`
- Modify: `packages/i18n/locales/en.json:231-232`
- Modify: `packages/i18n/locales/fr.json:231-232`

**Interfaces:**
- Consumes: `CalendarEvent` type from `./types` (`{ id, title, description?, startDate, endDate, allDay?, color }`), `eventDotClasses` from `./colors`.
- Produces: `EventDetail` component with props `{ event: CalendarEvent; onEdit: () => void; onDelete: () => void; onBack: () => void; className?: string }`, exported from `apps/web/src/components/ui/event-calendar/index.ts` as `EventDetail` / `type EventDetailProps`. Also exports `EventDialog` and `type EventDialogState` from the same barrel (previously internal-only), which Tasks 3 and 4 need to open the edit modal from the detail routes. Also exports `COLOR_LABELS: Record<EventColor, string>` from `./colors`.

- [ ] **Step 1: Write the failing test for `EventDetail`**

Create `apps/web/src/components/ui/event-calendar/event-detail.test.tsx`:

```tsx
import { render, screen, within } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import dayjs from "dayjs"
import { describe, expect, it, vi } from "vitest"

import { EventDetail } from "./event-detail"
import type { CalendarEvent } from "./types"

function makeEvent(overrides: Partial<CalendarEvent> = {}): CalendarEvent {
  return {
    id: "1",
    title: "Standup",
    startDate: dayjs().hour(9).minute(0).second(0).millisecond(0).toDate(),
    endDate: dayjs().hour(9).minute(30).second(0).millisecond(0).toDate(),
    color: "blue",
    ...overrides,
  }
}

describe("EventDetail", () => {
  it("renders the event title and description", () => {
    const event = makeEvent({ description: "Daily sync" })
    render(
      <EventDetail
        event={event}
        onEdit={vi.fn()}
        onDelete={vi.fn()}
        onBack={vi.fn()}
      />
    )

    expect(
      screen.getByRole("heading", { name: "Standup" })
    ).toBeInTheDocument()
    expect(screen.getByText("Daily sync")).toBeInTheDocument()
  })

  it("calls onBack when the back button is clicked", async () => {
    const user = userEvent.setup()
    const onBack = vi.fn()
    render(
      <EventDetail
        event={makeEvent()}
        onEdit={vi.fn()}
        onDelete={vi.fn()}
        onBack={onBack}
      />
    )

    await user.click(screen.getByRole("button", { name: "Back to calendar" }))
    expect(onBack).toHaveBeenCalledTimes(1)
  })

  it("calls onEdit when the edit button is clicked", async () => {
    const user = userEvent.setup()
    const onEdit = vi.fn()
    render(
      <EventDetail
        event={makeEvent()}
        onEdit={onEdit}
        onDelete={vi.fn()}
        onBack={vi.fn()}
      />
    )

    await user.click(screen.getByRole("button", { name: "Edit" }))
    expect(onEdit).toHaveBeenCalledTimes(1)
  })

  it("calls onDelete after confirming in the alert dialog", async () => {
    const user = userEvent.setup()
    const onDelete = vi.fn()
    render(
      <EventDetail
        event={makeEvent()}
        onEdit={vi.fn()}
        onDelete={onDelete}
        onBack={vi.fn()}
      />
    )

    await user.click(screen.getByRole("button", { name: "Delete" }))
    const confirmDialog = await screen.findByRole("alertdialog")
    await user.click(
      within(confirmDialog).getByRole("button", { name: "Delete" })
    )

    expect(onDelete).toHaveBeenCalledTimes(1)
  })
})
```

- [ ] **Step 2: Run the test to verify it fails**

Run: `pnpm --filter @echo/web exec vitest run src/components/ui/event-calendar/event-detail.test.tsx`
Expected: FAIL with a module-resolution error — `./event-detail` does not exist yet.

- [ ] **Step 3: Move `COLOR_LABELS` into `colors.ts` so both `EventDialog` and `EventDetail` can share it**

In `apps/web/src/components/ui/event-calendar/colors.ts`, append:

```ts
export const COLOR_LABELS: Record<EventColor, string> = {
  blue: "Blue",
  green: "Green",
  red: "Red",
  yellow: "Yellow",
  purple: "Purple",
  orange: "Orange",
}
```

In `apps/web/src/components/ui/event-calendar/event-dialog.tsx`, change the import (around line 46):

```ts
import { EVENT_COLORS, eventDotClasses } from "./colors"
```

to:

```ts
import { COLOR_LABELS, EVENT_COLORS, eventDotClasses } from "./colors"
```

and delete the local declaration (lines 72-79):

```ts
const COLOR_LABELS: Record<EventColor, string> = {
  blue: "Blue",
  green: "Green",
  red: "Red",
  yellow: "Yellow",
  purple: "Purple",
  orange: "Orange",
}
```

- [ ] **Step 4: Implement `EventDetail`**

Create `apps/web/src/components/ui/event-calendar/event-detail.tsx`:

```tsx
import dayjs from "dayjs"
import { ArrowLeft } from "lucide-react"
import { useTranslation } from "react-i18next"

import { cn } from "@/lib/utils"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"

import { COLOR_LABELS, eventDotClasses } from "./colors"
import type { CalendarEvent } from "./types"

export interface EventDetailProps {
  event: CalendarEvent
  onEdit: () => void
  onDelete: () => void
  onBack: () => void
  className?: string
}

export function EventDetail({
  event,
  onEdit,
  onDelete,
  onBack,
  className,
}: EventDetailProps) {
  const { t } = useTranslation("calendar")

  const dateFormat = event.allDay ? "MMMM D, YYYY" : "MMMM D, YYYY h:mm A"
  const start = dayjs(event.startDate).format(dateFormat)
  const end = dayjs(event.endDate).format(dateFormat)

  return (
    <div
      data-slot="event-detail"
      className={cn("flex flex-col gap-6", className)}
    >
      <Button
        type="button"
        variant="ghost"
        size="sm"
        className="w-fit"
        onClick={onBack}
      >
        <ArrowLeft className="size-4" data-icon="inline-start" />
        {t("Back to calendar")}
      </Button>

      <div className="flex flex-col gap-3">
        <div className="flex items-center gap-2">
          <span
            className={cn("size-2.5 rounded-full", eventDotClasses[event.color])}
          />
          <span className="text-sm text-muted-foreground">
            {t(COLOR_LABELS[event.color])}
          </span>
          {event.allDay && <Badge variant="outline">{t("All day")}</Badge>}
        </div>

        <h1 className="text-2xl font-bold">{event.title}</h1>

        <p className="text-sm text-muted-foreground">
          {start === end ? start : `${start} – ${end}`}
        </p>

        {event.description && (
          <p className="whitespace-pre-wrap">{event.description}</p>
        )}
      </div>

      <div className="flex gap-2">
        <Button type="button" onClick={onEdit}>
          {t("Edit")}
        </Button>
        <AlertDialog>
          <AlertDialogTrigger asChild>
            <Button type="button" variant="destructive">
              {t("Delete")}
            </Button>
          </AlertDialogTrigger>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>{t("Delete event?")}</AlertDialogTitle>
              <AlertDialogDescription>
                {t(
                  "This will permanently delete this event. This action cannot be undone."
                )}
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>{t("Cancel")}</AlertDialogCancel>
              <AlertDialogAction onClick={onDelete}>
                {t("Delete")}
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </div>
  )
}
```

- [ ] **Step 5: Add the `Edit` and `Back to calendar` locale keys**

In `packages/i18n/locales/en.json`, change (line 231-232):

```json
    "Cancel": "Cancel",
    "Delete": "Delete",
```

to:

```json
    "Cancel": "Cancel",
    "Edit": "Edit",
    "Delete": "Delete",
```

and change (line 237, `"No events scheduled": "No events scheduled",`) to:

```json
    "No events scheduled": "No events scheduled",
    "Back to calendar": "Back to calendar",
```

In `packages/i18n/locales/fr.json`, change (line 231-232):

```json
    "Cancel": "Annuler",
    "Delete": "Supprimer",
```

to:

```json
    "Cancel": "Annuler",
    "Edit": "Modifier",
    "Delete": "Supprimer",
```

and change (line 237, `"No events scheduled": "Aucun événement prévu",`) to:

```json
    "No events scheduled": "Aucun événement prévu",
    "Back to calendar": "Retour au calendrier",
```

- [ ] **Step 6: Export `EventDetail`, `EventDialog`, and `EventDialogState` from the barrel**

In `apps/web/src/components/ui/event-calendar/index.ts`, change the full file to:

```ts
export { EventCalendar, type EventCalendarProps } from "./event-calendar"
export { EventDetail, type EventDetailProps } from "./event-detail"
export { EventDialog, type EventDialogState } from "./event-dialog"
export type {
  CalendarEvent,
  CalendarEventRange,
  CalendarView,
  EventColor,
} from "./types"
```

- [ ] **Step 7: Run the test to verify it passes**

Run: `pnpm --filter @echo/web exec vitest run src/components/ui/event-calendar/event-detail.test.tsx`
Expected: PASS — all four tests succeed.

- [ ] **Step 8: Run the whole event-calendar test suite to check nothing else broke**

Run: `pnpm --filter @echo/web exec vitest run src/components/ui/event-calendar`
Expected: PASS — `event-calendar.test.tsx`, `event-detail.test.tsx`, and `helpers.test.ts` all pass.

- [ ] **Step 9: Add the Storybook file**

Create `apps/web/src/components/ui/event-calendar/event-detail.stories.tsx`:

```tsx
import type { Meta, StoryObj } from "@storybook/react"

import { EventDetail } from "./event-detail"

const meta = {
  title: "UI/EventDetail",
  component: EventDetail,
  parameters: {
    layout: "centered",
  },
  tags: ["autodocs"],
  decorators: [
    (Story) => (
      <div className="w-96">
        <Story />
      </div>
    ),
  ],
} satisfies Meta<typeof EventDetail>

export default meta
type Story = StoryObj<typeof meta>

const baseEvent = {
  id: "1",
  title: "Team standup",
  description: "Daily sync on current work and blockers.",
  startDate: new Date("2026-08-03T09:00:00"),
  endDate: new Date("2026-08-03T09:30:00"),
  color: "blue",
} as const

export const Default: Story = {
  args: {
    event: baseEvent,
    onEdit: () => {},
    onDelete: () => {},
    onBack: () => {},
  },
}

export const AllDay: Story = {
  args: {
    event: {
      ...baseEvent,
      title: "Company offsite",
      description: "Full-day offsite, no meetings.",
      allDay: true,
      color: "purple",
    },
    onEdit: () => {},
    onDelete: () => {},
    onBack: () => {},
  },
}

export const NoDescription: Story = {
  args: {
    event: { ...baseEvent, description: undefined, color: "green" },
    onEdit: () => {},
    onDelete: () => {},
    onBack: () => {},
  },
}
```

- [ ] **Step 10: Commit**

```bash
git add apps/web/src/components/ui/event-calendar/colors.ts apps/web/src/components/ui/event-calendar/event-dialog.tsx apps/web/src/components/ui/event-calendar/event-detail.tsx apps/web/src/components/ui/event-calendar/event-detail.stories.tsx apps/web/src/components/ui/event-calendar/event-detail.test.tsx apps/web/src/components/ui/event-calendar/index.ts packages/i18n/locales/en.json packages/i18n/locales/fr.json
git commit -m "feat: add EventDetail component for calendar event pages"
```

---

### Task 3: Move the personal calendar to `/calendar` and add its detail route

**Files:**
- Create: `apps/web/src/routes/calendar/index.tsx` (content moved from `apps/web/src/routes/index.tsx`)
- Delete: `apps/web/src/routes/index.tsx`
- Create: `apps/web/src/routes/calendar/$eventId.tsx`
- Modify: `apps/web/src/hooks/use-navigation.ts:44-53`
- Modify: `packages/i18n/locales/en.json`
- Modify: `packages/i18n/locales/fr.json`
- Generated: `apps/web/src/routeTree.gen.ts` (regenerated, not hand-edited)

**Interfaces:**
- Consumes: `EventDetail`, `EventDialog`, `type EventDialogState`, `type CalendarEvent as ViewEvent` from `@/ui/event-calendar` (Task 2); `getUserEventsQueryOptions`, `updateUserEvent`, `deleteUserEvent`, `key as calendarKey` from `@/services/resources/calendar` (existing); `toViewEvent`, `fromViewEvent` from `@/lib/calendar-events` (existing).
- Produces: route `/calendar/` (personal calendar grid) and `/calendar/$eventId` (personal event detail page), plus a `Calendar` entry in the personal sidebar nav pointing at `/calendar`.

- [ ] **Step 1: Create the moved calendar grid route**

Create `apps/web/src/routes/calendar/index.tsx`:

```tsx
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useTranslation } from "react-i18next";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { EventCalendar } from "@/ui/event-calendar";
import type { CalendarEvent as ViewEvent } from "@/ui/event-calendar";
import {
  key as calendarKey,
  getUserEventsQueryOptions,
  createUserEvent,
  updateUserEvent,
  deleteUserEvent,
} from "@/services/resources/calendar";
import { toViewEvent, fromViewEvent } from "@/lib/calendar-events";

export const Route = createFileRoute("/calendar/")({
  staticData: { breadcrumb: "Calendar" },
  component: CalendarPage,
});

function CalendarPage() {
  const { t } = useTranslation("calendar");
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { data: events = [] } = useQuery(getUserEventsQueryOptions());

  const refresh = () => queryClient.invalidateQueries({ queryKey: calendarKey });

  const handleEventCreate = async (event: ViewEvent) => {
    await createUserEvent(fromViewEvent(event));
    refresh();
  };

  const handleEventUpdate = async (event: ViewEvent) => {
    await updateUserEvent({ id: event.id, ...fromViewEvent(event) });
    refresh();
  };

  const handleEventDelete = async (id: string) => {
    await deleteUserEvent({ id });
    refresh();
  };

  const handleEventClick = (event: ViewEvent) => {
    navigate({ to: "/calendar/$eventId", params: { eventId: event.id } });
  };

  return (
    <div className="flex h-[calc(100vh-4rem)] flex-col p-6">
      <div className="mb-6">
        <h1 className="text-3xl font-bold mb-2">{t("Calendar")}</h1>
        <p className="text-muted-foreground">
          {t("Manage your personal events and calendar")}
        </p>
      </div>
      <EventCalendar
        events={events.map(toViewEvent)}
        onEventClick={handleEventClick}
        onEventCreate={handleEventCreate}
        onEventUpdate={handleEventUpdate}
        onEventDelete={handleEventDelete}
        className="flex-1"
      />
    </div>
  );
}
```

- [ ] **Step 2: Delete the old root route**

```bash
git rm apps/web/src/routes/index.tsx
```

- [ ] **Step 3: Add the "Event not found" and breadcrumb locale keys**

In `packages/i18n/locales/en.json`, in the `calendar` namespace, change (the line you added in Task 2, `"Back to calendar": "Back to calendar",`) to also add the not-found strings right after it:

```json
    "Back to calendar": "Back to calendar",
    "Event not found": "Event not found",
    "This event doesn't exist or has been deleted.": "This event doesn't exist or has been deleted.",
```

In the `navigation` namespace of `packages/i18n/locales/en.json`, change:

```json
    "Members": "Members"
  },
```

to:

```json
    "Members": "Members",
    "Event details": "Event details"
  },
```

In `packages/i18n/locales/fr.json`, in the `calendar` namespace, change (the line you added in Task 2, `"Back to calendar": "Retour au calendrier",`) to:

```json
    "Back to calendar": "Retour au calendrier",
    "Event not found": "Événement introuvable",
    "This event doesn't exist or has been deleted.": "Cet événement n'existe pas ou a été supprimé.",
```

In the `navigation` namespace of `packages/i18n/locales/fr.json`, change:

```json
    "Backlog": "Backlog",
    "Schedule": "Agenda",
```

to:

```json
    "Backlog": "Backlog",
    "Calendar": "Agenda",
    "Schedule": "Agenda",
```

(this fixes a pre-existing gap: the French `navigation` namespace never got a `"Calendar"` key when the org calendar nav item was added, so `t("Calendar")` under `useTranslation("navigation")` was already falling back to the raw key in French — the new personal nav entry in Step 5 depends on this same key)

and change:

```json
    "Members": "Membres"
  },
```

to:

```json
    "Members": "Membres",
    "Event details": "Détails de l'événement"
  },
```

- [ ] **Step 4: Create the personal event detail route**

Create `apps/web/src/routes/calendar/$eventId.tsx`:

```tsx
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { useTranslation } from "react-i18next";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import {
  EventDetail,
  EventDialog,
  type EventDialogState,
} from "@/ui/event-calendar";
import type { CalendarEvent as ViewEvent } from "@/ui/event-calendar";
import {
  key as calendarKey,
  getUserEventsQueryOptions,
  updateUserEvent,
  deleteUserEvent,
} from "@/services/resources/calendar";
import { toViewEvent, fromViewEvent } from "@/lib/calendar-events";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/calendar/$eventId")({
  staticData: { breadcrumb: "Event details" },
  component: EventDetailPage,
});

function EventDetailPage() {
  const { t } = useTranslation("calendar");
  const { eventId } = Route.useParams();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { data: events = [] } = useQuery(getUserEventsQueryOptions());
  const [dialogState, setDialogState] = useState<EventDialogState>(null);

  const event = events.find((e) => e.id === eventId);

  const refresh = () => queryClient.invalidateQueries({ queryKey: calendarKey });

  const goBack = () => navigate({ to: "/calendar" });

  if (!event) {
    return (
      <div className="flex h-[calc(100vh-4rem)] flex-col items-center justify-center gap-4 p-6">
        <h1 className="text-2xl font-bold">{t("Event not found")}</h1>
        <p className="text-muted-foreground">
          {t("This event doesn't exist or has been deleted.")}
        </p>
        <Button type="button" onClick={goBack}>
          {t("Back to calendar")}
        </Button>
      </div>
    );
  }

  const viewEvent = toViewEvent(event);

  const handleDelete = async (id: string) => {
    await deleteUserEvent({ id });
    refresh();
    goBack();
  };

  const handleSubmit = async (updated: ViewEvent) => {
    await updateUserEvent({ id: updated.id, ...fromViewEvent(updated) });
    refresh();
    setDialogState(null);
  };

  return (
    <div className="flex h-[calc(100vh-4rem)] flex-col p-6">
      <EventDetail
        event={viewEvent}
        onEdit={() => setDialogState({ mode: "edit", event: viewEvent })}
        onDelete={() => handleDelete(viewEvent.id)}
        onBack={goBack}
      />
      <EventDialog
        state={dialogState}
        onOpenChange={(open) => !open && setDialogState(null)}
        onSubmit={handleSubmit}
        onDelete={handleDelete}
      />
    </div>
  );
}
```

- [ ] **Step 5: Add the personal `Calendar` nav item**

In `apps/web/src/hooks/use-navigation.ts`, change (lines 44-53):

```ts
  const personalNavGroups: NavGroup[] = [
    {
      title: t("Personal"),
      items: [
        { title: t("Planning"), to: "/" },
        { title: t("Practice"), to: "/" },
        { title: t("Backlog"), to: "/" },
      ],
    },
  ]
```

to:

```ts
  const personalNavGroups: NavGroup[] = [
    {
      title: t("Personal"),
      items: [
        { title: t("Calendar"), to: "/calendar" },
        { title: t("Planning"), to: "/" },
        { title: t("Practice"), to: "/" },
        { title: t("Backlog"), to: "/" },
      ],
    },
  ]
```

- [ ] **Step 6: Regenerate the route tree**

Run: `pnpm --filter @echo/web exec vite build`
Expected: build succeeds; `apps/web/src/routeTree.gen.ts` is rewritten to include `/calendar/` and `/calendar/$eventId` and no longer includes `/`.

- [ ] **Step 7: Typecheck**

Run: `pnpm --filter @echo/web typecheck`
Expected: PASS — no type errors (confirms `navigate({ to: "/calendar/$eventId", params: { eventId } })` and `Route.useParams()` resolve against the regenerated route tree).

- [ ] **Step 8: Run the full web test suite**

Run: `pnpm --filter @echo/web test`
Expected: PASS — existing tests (including Task 1 and Task 2's) are unaffected by the route move.

- [ ] **Step 9: Commit**

```bash
git add apps/web/src/routes/calendar apps/web/src/routes/index.tsx apps/web/src/routeTree.gen.ts apps/web/src/hooks/use-navigation.ts packages/i18n/locales/en.json packages/i18n/locales/fr.json
git commit -m "feat: move personal calendar to /calendar and add event detail page"
```

---

### Task 4: Add the organization event detail route

**Files:**
- Modify: `apps/web/src/routes/organizations/$organizationSlug/calendar/index.tsx`
- Create: `apps/web/src/routes/organizations/$organizationSlug/calendar/$eventId.tsx`
- Generated: `apps/web/src/routeTree.gen.ts` (regenerated, not hand-edited)

**Interfaces:**
- Consumes: `organizationId` from `Route.useRouteContext()` (already provided by the parent `organizations/$organizationSlug/route.tsx` `beforeLoad`); `EventDetail`, `EventDialog`, `type EventDialogState` from `@/ui/event-calendar` (Task 2); `getOrganizationEventsQueryOptions`, `updateOrganizationEvent`, `deleteOrganizationEvent`, `key as calendarKey` from `@/services/resources/calendar` (existing).
- Produces: route `/organizations/$organizationSlug/calendar/$eventId`.

- [ ] **Step 1: Wire `onEventClick` into the org calendar grid**

In `apps/web/src/routes/organizations/$organizationSlug/calendar/index.tsx`, change the full file to:

```tsx
import { createFileRoute, useNavigate } from '@tanstack/react-router'

import { useTranslation } from 'react-i18next'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { EventCalendar } from '@/ui/event-calendar'
import type { CalendarEvent as ViewEvent } from '@/ui/event-calendar'
import {
  key as calendarKey,
  getOrganizationEventsQueryOptions,
  createOrganizationEvent,
  updateOrganizationEvent,
  deleteOrganizationEvent,
} from '@/services/resources/calendar'
import { toViewEvent, fromViewEvent } from '@/lib/calendar-events'

export const Route = createFileRoute(
  '/organizations/$organizationSlug/calendar/',
)({
  staticData: { breadcrumb: 'Calendar' },
  component: OrganizationCalendarPage,
})

function OrganizationCalendarPage() {
  const { t } = useTranslation('calendar')
  const { organizationId } = Route.useRouteContext()
  const { organizationSlug } = Route.useParams()
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const { data: events = [] } = useQuery(getOrganizationEventsQueryOptions({ organizationId }))

  const refresh = () => queryClient.invalidateQueries({ queryKey: calendarKey })

  const handleEventCreate = async (event: ViewEvent) => {
    await createOrganizationEvent({ organizationId, ...fromViewEvent(event) })
    refresh()
  }

  const handleEventUpdate = async (event: ViewEvent) => {
    await updateOrganizationEvent({ id: event.id, organizationId, ...fromViewEvent(event) })
    refresh()
  }

  const handleEventDelete = async (id: string) => {
    await deleteOrganizationEvent({ id, organizationId })
    refresh()
  }

  const handleEventClick = (event: ViewEvent) => {
    navigate({
      to: '/organizations/$organizationSlug/calendar/$eventId',
      params: { organizationSlug, eventId: event.id },
    })
  }

  return (
    <div className="flex h-[calc(100vh-4rem)] flex-col p-6">
      <div className="mb-6">
        <h1 className="text-3xl font-bold mb-2">{t('Schedule')}</h1>
        <p className="text-muted-foreground">
          {t("Manage your organization's events and schedule")}
        </p>
      </div>
      <EventCalendar
        events={events.map(toViewEvent)}
        onEventClick={handleEventClick}
        onEventCreate={handleEventCreate}
        onEventUpdate={handleEventUpdate}
        onEventDelete={handleEventDelete}
        className="flex-1"
      />
    </div>
  )
}
```

- [ ] **Step 2: Create the organization event detail route**

Create `apps/web/src/routes/organizations/$organizationSlug/calendar/$eventId.tsx`:

```tsx
import { createFileRoute, useNavigate } from '@tanstack/react-router'
import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import {
  EventDetail,
  EventDialog,
  type EventDialogState,
} from '@/ui/event-calendar'
import type { CalendarEvent as ViewEvent } from '@/ui/event-calendar'
import {
  key as calendarKey,
  getOrganizationEventsQueryOptions,
  updateOrganizationEvent,
  deleteOrganizationEvent,
} from '@/services/resources/calendar'
import { toViewEvent, fromViewEvent } from '@/lib/calendar-events'
import { Button } from '@/components/ui/button'

export const Route = createFileRoute(
  '/organizations/$organizationSlug/calendar/$eventId',
)({
  staticData: { breadcrumb: 'Event details' },
  component: OrganizationEventDetailPage,
})

function OrganizationEventDetailPage() {
  const { t } = useTranslation('calendar')
  const { organizationSlug, eventId } = Route.useParams()
  const { organizationId } = Route.useRouteContext()
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const { data: events = [] } = useQuery(
    getOrganizationEventsQueryOptions({ organizationId }),
  )
  const [dialogState, setDialogState] = useState<EventDialogState>(null)

  const event = events.find((e) => e.id === eventId)

  const refresh = () =>
    queryClient.invalidateQueries({ queryKey: calendarKey })

  const goBack = () =>
    navigate({
      to: '/organizations/$organizationSlug/calendar',
      params: { organizationSlug },
    })

  if (!event) {
    return (
      <div className="flex h-[calc(100vh-4rem)] flex-col items-center justify-center gap-4 p-6">
        <h1 className="text-2xl font-bold">{t('Event not found')}</h1>
        <p className="text-muted-foreground">
          {t("This event doesn't exist or has been deleted.")}
        </p>
        <Button type="button" onClick={goBack}>
          {t('Back to calendar')}
        </Button>
      </div>
    )
  }

  const viewEvent = toViewEvent(event)

  const handleDelete = async (id: string) => {
    await deleteOrganizationEvent({ id, organizationId })
    refresh()
    goBack()
  }

  const handleSubmit = async (updated: ViewEvent) => {
    await updateOrganizationEvent({
      id: updated.id,
      organizationId,
      ...fromViewEvent(updated),
    })
    refresh()
    setDialogState(null)
  }

  return (
    <div className="flex h-[calc(100vh-4rem)] flex-col p-6">
      <EventDetail
        event={viewEvent}
        onEdit={() => setDialogState({ mode: 'edit', event: viewEvent })}
        onDelete={() => handleDelete(viewEvent.id)}
        onBack={goBack}
      />
      <EventDialog
        state={dialogState}
        onOpenChange={(open) => !open && setDialogState(null)}
        onSubmit={handleSubmit}
        onDelete={handleDelete}
      />
    </div>
  )
}
```

- [ ] **Step 3: Regenerate the route tree**

Run: `pnpm --filter @echo/web exec vite build`
Expected: build succeeds; `apps/web/src/routeTree.gen.ts` now includes `/organizations/$organizationSlug/calendar/$eventId`.

- [ ] **Step 4: Typecheck**

Run: `pnpm --filter @echo/web typecheck`
Expected: PASS.

- [ ] **Step 5: Run the full web test suite**

Run: `pnpm --filter @echo/web test`
Expected: PASS.

- [ ] **Step 6: Commit**

```bash
git add apps/web/src/routes/organizations apps/web/src/routeTree.gen.ts
git commit -m "feat: add organization calendar event detail page"
```

---

## Manual verification (after Task 4)

Automated tests cover `EventCalendar`'s click behavior and `EventDetail`'s rendering/interactions in isolation; the route wiring itself has no automated coverage (matching the rest of this codebase — no existing route has route-level tests). Before considering this done, run `pnpm dev:web`, log in, and click through:

1. Personal calendar (`/calendar`): click an event → lands on `/calendar/$eventId` showing the event; click Edit → modal opens pre-filled, save updates and returns to the detail page; click Delete → confirm → returns to `/calendar` and the event is gone.
2. Organization calendar (`/organizations/$slug/calendar`): same flow at `/organizations/$slug/calendar/$eventId`.
3. Day-overflow popover ("+N more"): click an event inside it → also navigates to the detail page.
4. Visit a `/calendar/$eventId` URL with a made-up id → "Event not found" state with a working "Back to calendar" button.
