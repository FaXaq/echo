---
name: frontend-loading-best-practices
description: Use when building or reviewing a React component/route in apps/web that fetches data or can be in a loading/empty/error state — covers Suspense boundaries, useSuspenseQuery, skeletons vs spinners, route loaders, and where fetching code is allowed to live (ui/ vs features/)
---

# Frontend Loading Best Practices

## Overview

`apps/web` is React 18 + TanStack Router + tRPC-via-React-Query + shadcn/ui. Data-loading UI in this codebase has drifted: some pages show nothing while loading, some conflate "loading" with "not found," and a correct Suspense pattern already exists but sits unused. This skill is the fix: four rules for where fetching code lives and how loading states render, kept in sync as the codebase evolves.

## Core Rules

1. **`components/ui/**` never fetches.** Presentational only — props and callbacks in, JSX out. If it needs a loading look, it takes an `isLoading`/`loading` prop and renders a `Skeleton` (`@/components/ui/skeleton`, shadcn shimmer) — it never calls `useQuery` itself. This is existing, already-enforced policy — see `[[feedback-web-ui-pure-components]]`, superseded on *location*: relocated components go to `components/features/`, not the root of `components/`.
2. **Anything that fetches or depends on a resource is a `Suspended<Name>` component under `components/features/`.** It wraps the real content in both an `ErrorBoundary` (`react-error-boundary`) and `<Suspense>`, and the inner component reads data with `useSuspenseQuery`, never plain `useQuery` + manual `isPending` branching.
3. **Prefer that pattern over route `loader`s.** Use a TanStack Router `loader` only when the route genuinely needs data before it can render (redirects, breadcrumbs, layout that depends on the data). When you do use one, it must always be paired with both `pendingComponent` and `errorComponent` on the route — a bare `loader` with no fallback UI is not allowed.
4. **Never let "loading" and "not found"/"error" collapse into the same branch.** They're different states with different UI.

## Quick Reference

| Situation | Pattern |
|---|---|
| Component renders once its data resource resolves | `Suspended<Name>` in `components/features/`: `ErrorBoundary` + `Suspense` + `useSuspenseQuery` inside |
| Reusable dumb piece (list item, field, card) | Stays in `components/ui/`, takes `loading?: boolean`, renders `<Skeleton>` |
| Route can't render meaningfully without data first (redirect/breadcrumb) | Router `loader` + `pendingComponent` + `errorComponent` on that route |
| Submit/mutation in flight | `Button isLoading` → `Spinner` (unchanged, this already works — mutations aren't queries) |
| Distinguishing "still loading" vs "genuinely absent" | Separate `isLoading`/`isPending` and `!data` checks — never one `if` for both |

## Implementation

### The `Suspended<Name>` shape

`components/event-calendar/event-attachments.tsx` already has the right skeleton of this pattern (`Suspense` + `useSuspenseQuery` + a `Skeleton` fallback) — it's just missing the `ErrorBoundary`, and it lives in `components/event-calendar/` instead of `components/features/event-calendar/`. Target shape:

```tsx
// components/features/event-calendar/suspended-event-attachments.tsx
import { Suspense } from "react"
import { ErrorBoundary } from "react-error-boundary"
import { useSuspenseQuery } from "@tanstack/react-query"
import { Skeleton } from "@/components/ui/skeleton"
import { getEventFilesQueryOptions } from "@/services/resources/file"

function EventAttachmentsContent({ eventId }: { eventId: string }) {
  const { data: files } = useSuspenseQuery(getEventFilesQueryOptions({ eventId }))
  return /* render files — pure UI pieces from components/ui below this */
}

function EventAttachmentsError() {
  return <p className="text-xs text-destructive">{/* t("Couldn't load attachments") */}</p>
}

export function SuspensedEventAttachments({ eventId }: { eventId: string }) {
  return (
    <ErrorBoundary FallbackComponent={EventAttachmentsError}>
      <Suspense fallback={<Skeleton className="h-8 w-full" />}>
        <EventAttachmentsContent eventId={eventId} />
      </Suspense>
    </ErrorBoundary>
  )
}
```

Naming: the exported wrapper is `Suspended<Name>`; the inner data-reading component and the error fallback stay private to the file.

### Route loaders — sparingly, always with fallbacks

```tsx
export const Route = createFileRoute("/calendar/$eventId")({
  loader: ({ params }) => ensureEventQueryData(params.eventId), // see prerequisite below
  pendingComponent: EventDetailSkeleton,
  errorComponent: EventDetailError,
  component: EventDetailPage,
})
```

Don't reach for this by default — most pages should render immediately and let a `Suspended<Name>` handle its own loading/error locally. Use a loader only when you can't.

**Prerequisite, not yet true in this repo:** `ensureQueryData` in a loader needs the `queryClient` reachable outside React, via router `context`. Right now `queryClient` is created inside `RootLayout` with `useState` (`routes/__root.tsx`) and never put on `MyRouterContext` — only `auth` is injected that way today (`router.tsx`). Wire `queryClient` into `MyRouterContext` the same way before using `ensureQueryData` in any loader; until then, stick to rule 2 (`Suspended<Name>` + `useSuspenseQuery`) for data fetching.

**Also not yet true:** `react-error-boundary` isn't installed. Add it before building the first `Suspended<Name>` component.

## Common Mistakes (seen in this codebase)

- **Loading and not-found collapsed into one branch.** `routes/calendar/$eventId.tsx` and its org-scoped twin do `if (!event) return <NotFound />` — that's also true while the query is still loading, so every navigation briefly flashes "This event doesn't exist." Always check `isLoading`/`isPending` separately from `!data`.
- **A correct pattern built, then never wired in.** `EventAttachments` has the right Suspense+Skeleton shape but nothing renders it — `EventDetail` never imports it. A `Suspended<Name>` component is only worth anything from the route/page that's supposed to show it; check it's actually reachable, not just present in the tree of files.
- **Sequential waterfalls instead of parallel fetches.** `organizations/$organizationSlug/members/index.tsx`'s loader `await`s four queries one after another. In a loader, fetch independent resources with `Promise.all`, not sequential `await`.
- **Fetching logic leaking into `components/ui/`.** If a file under `ui/` imports from `@/services/*` or calls `useQuery`/`useSuspenseQuery`/a mutation hook, it's misplaced — move it to `components/features/`.
