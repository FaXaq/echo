# Triage Labels

The skills speak in terms of five canonical triage roles. This file maps those roles to the actual label strings used in this repo's issue tracker (Linear — see `issue-tracker.md`).

| Label in mattpocock/skills | Label in our tracker | Meaning                                  |
| -------------------------- | -------------------- | ---------------------------------------- |
| `needs-triage`             | `needs-triage`       | Maintainer needs to evaluate this issue  |
| `needs-info`               | `needs-info`         | Waiting on reporter for more information |
| `ready-for-agent`          | `ready-for-agent`    | Fully specified, ready for an AFK agent  |
| `ready-for-human`          | `ready-for-human`    | Requires human implementation            |
| `wontfix`                  | `wontfix`            | Will not be actioned                     |

When a skill mentions a role (e.g. "apply the AFK-ready triage label"), use the corresponding label string from this table.

All five live under a **`Triage` label group** on the `Echo` team, alongside the existing `Tech` and `Design` groups. Linear groups are **mutually exclusive** — applying one triage label automatically clears any other, so an issue is never both `needs-info` and `ready-for-agent`. Set the new state; don't try to remove the old one first.

The label names are deliberately lowercase-kebab (matching the skills' vocabulary) while the rest of this workspace uses Capitalized nouns — that visual difference marks them as agent-facing.

These labels exist as of setup. If one goes missing, have it recreated rather than substituting a similar-looking label.

Edit the right-hand column to match whatever vocabulary you actually use.
