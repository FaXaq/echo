---
name: frontend-empty-states
description: Use when building or reviewing any list, table, grid or collection in apps/web (songs, playlists, attachments, events, contacts, files…) — every list MUST render a ListEmptyState when it has no items; covers which component to use, what copy to write, and when to add an action
---

# Frontend Empty States

Every list in `apps/web` renders an explicit empty state. A list that renders nothing (or a bare grey sentence) when it's empty is a bug: the user can't tell "empty" from "broken" or "still loading", and loses the one moment where the UI can tell them what to do next.

## Rules

1. **Use `ListEmptyState`** (`@/components/ui/list-empty-state`, built on shadcn `Empty`). Don't hand-roll `<p className="text-muted-foreground">No … yet.</p>`.
2. **Always pass an `icon`** — the same lucide icon the entity uses elsewhere (`Music` for songs, `ListMusic` for playlists, `Paperclip` for files…).
3. **`title`**: `No <things> yet` / `No <things> in this <parent>` — no trailing period.
4. **`description`**: one sentence saying what the list is *for* or *how to fill it* (pointing at the real control: "with the + button", "with the button above"). Skip it only for nested, secondary lists (e.g. songs inside an event's collapsed playlist).
5. **`action`**: when the page owns the create flow, repeat the primary create button inside the empty state (`size="sm"`, same label as the header button). Don't add an action that duplicates a control sitting right next to it.
6. **Nested/compact lists** pass `className="py-4"`; top-level page lists keep the default.
7. Empty ≠ loading ≠ error — loading is a `Skeleton` from the `Suspense` fallback, errors come from the `ErrorBoundary` (see `frontend-loading-best-practices`). The empty state only renders once data has resolved to zero items.
8. Strings go through Lingui (`t` / `<Trans>`) and get a hand-written French `msgstr`.

## Checklist when adding a list

- [ ] `items.length === 0` branch renders `ListEmptyState`
- [ ] icon + title (+ description, + action if the page owns creation)
- [ ] the component test asserts the empty-state title
- [ ] `pnpm i18n:extract`, fill `fr` msgstr, `pnpm i18n:compile`
