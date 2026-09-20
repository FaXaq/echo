# Outreach Columns stay freeform, no status semantics yet

Outreach's Columns (À contacter/Contacté/En discussion/Refus/Accepté) are freeform: renamable, reorderable, and deletable, seeded only as defaults. This means no code can reliably key off "the Accepted column" — a future feature wanting to trigger something on acceptance (e.g. creating a Calendar Event) has no semantic hook to attach to, since the Column a user sees is just user-owned text and position.

## Considered Options

- **Position-based inference**: treat the first Column as "Todo" and the last as "Done." Rejected — deleting or reordering Columns would silently change what counts as start/end, and "first thing on the board" doesn't reliably mean "not yet actioned" for every Organization's workflow.
- **An explicit fixed `status` enum on the Card** (Todo/In Progress/Done), independent of Column. Considered during this feature's design and deferred — no concrete driver for it yet.

## Consequences

Any future automation tied to "the outreach was accepted" needs a new, explicit mechanism (a `kind` flag on Column, the deferred `status` field above, or something else) — it can't be inferred from Column name or position as they exist today.
