# Issue tracker: Linear

Issues and specs for this repo live in **Linear**, not GitHub Issues. The team's issue key prefix is `ECH`, so tickets look like `ECH-123`.

Agents reach Linear through the **Linear MCP server**, registered as `linear-server` — its tools are exposed as `mcp__linear-server__*`. Do not shell out to `gh issue ...`; GitHub Issues are not used for this repo. GitHub is still the code host, so `gh pr ...` remains correct for pull requests.

## Setup

The server is declared in the repo's `.mcp.json`, so it ships with a clone — no manual registration needed. Each developer still authenticates individually: OAuth tokens are per-machine and never checked in.

On first use Claude Code asks you to approve the project-scoped server, then `/mcp` runs Linear's OAuth flow. Until that's done, `claude mcp list` reports `! Needs authentication` and no `mcp__linear-server__*` tools are exposed. If those tools are unavailable, stop and tell the user rather than falling back to another tracker.

## Conventions

The team is named `Echo` and its issue key is `ECH`. Both are accepted wherever a tool takes a `team` parameter.

Linear's MCP tools are **upserts**, not separate create/update pairs — `save_issue` with no id creates, with an id updates. Verify names against your available tool list before relying on them; the server's surface changes over time.

- **Create an issue**: `save_issue` with `team: "Echo"`. Title is a single line; put the full body in `description` as Markdown, with real newlines — not literal `\n`.
- **Read an issue**: `get_issue` with the identifier (`ECH-123`), plus `list_comments`. Both matter — decisions often live in comments, not the description.
- **List issues**: `list_issues` with `team: "Echo"` and a `state`, `label`, or `query` filter. Filter server-side rather than fetching everything, and request only the `fields` you need. Note `includeArchived` defaults to **true** — pass `false` when you want live work only.
- **Comment on an issue**: `save_comment`.
- **Apply / remove labels**: `save_issue` with the desired label set. Labels must already exist — check with `list_issue_labels`. `create_issue_label` exists, but don't invent taxonomy unprompted; ask first, and never substitute a near-miss name for a missing label.
- **Close**: `save_issue` moving the issue to a completed or canceled workflow state. Linear models this as a state transition, not a boolean — completed work goes to **Done**, `wontfix` work to **Canceled**.

Current `Echo` workflow states: `Backlog`, `Todo`, `In Progress`, `In Review`, `Done`, `Canceled`, `Duplicate`. Confirm with `list_issue_statuses` rather than assuming this list is current.

Tools accept the human identifier (`ECH-123`) as well as the internal UUID; prefer the identifier, and resolve via `get_issue` rather than guessing.

## When a skill says "publish to the issue tracker"

Create a Linear issue on the `ECH` team.

## When a skill says "fetch the relevant ticket"

Fetch the Linear issue by its `ECH-` identifier, including its comments.

## Pull requests as a request surface

**PRs as a request surface: no.** _(Set to `yes` if this repo treats external GitHub PRs as feature requests; `/triage` reads this flag.)_

## Wayfinding operations

Used by `/wayfinder`. The **map** is a single issue with **child** issues as tickets.

- **Map**: an issue labelled `wayfinder:map`, holding the Notes / Decisions-so-far / Fog body.
- **Child ticket**: a Linear **sub-issue** of the map (set the parent on create). Labels: `wayfinder:<type>` (`research`/`prototype`/`grilling`/`task`). Once claimed, the ticket is assigned to the driving dev.
- **Blocking**: Linear's native **issue relations** — create a `blocks` / `blocked by` relation between tickets. A ticket is unblocked when every blocker has reached a completed or canceled state.
- **Frontier query**: list the map's open sub-issues, drop any with an unresolved blocker relation or an assignee; first in map order wins.
- **Claim**: assign the issue to the current user — the session's first write.
- **Resolve**: comment the answer on the ticket, move it to Done, then append a context pointer to the map's Decisions-so-far.
