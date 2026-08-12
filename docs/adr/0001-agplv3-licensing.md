# 1. License Echo under AGPL-3.0-only

Date: 2026-08-13

## Status

Accepted

## Context

Echo is a hosted web application for musicians and bands. The intent is to run it
commercially as a SaaS while keeping the source open.

Those two goals pull against each other. A permissive license (MIT, Apache-2.0)
lets anyone take the code and run a competing hosted service without giving
anything back — the frontend ships to every visitor's browser, so the code is
effectively public regardless of license. A proprietary license forecloses the
open-source posture entirely.

At the time of this decision the repository is 296 commits, all authored by one
person. There are no third-party contributions, so the copyright chain is
entirely held by a single owner and every option is still open. That will stop
being true the first time an external patch is merged.

## Decision

Echo is licensed under the **GNU Affero General Public License, version 3 only**
(`AGPL-3.0-only`).

- `LICENSE` holds the verbatim AGPL-3.0 text as published by the FSF.
- The root `package.json` and all eleven workspace packages declare
  `"license": "AGPL-3.0-only"` alongside `"private": true`.
- No per-file license headers. The repository-level notices carry the grant.

### Why AGPL rather than a permissive license

Section 13 is the whole reason. It extends copyleft to network use: anyone who
offers a modified Echo to users over a network must publish the corresponding
source. Under MIT or Apache-2.0 a competitor could host a modified Echo and
publish nothing. AGPL is the only widely-recognised license that closes this gap
for software whose primary distribution channel is a server rather than a
download.

### Why `-only` rather than `-or-later`

`-or-later` would pre-commit the project to the terms of any future AGPL version,
written by the FSF, unread. `-only` keeps the licensing decision where the
copyright sits. While a single owner holds all copyright, moving to a future
version remains possible at any time by choice; the `-or-later` convenience buys
nothing that is not already available.

There is no CLA. One would let the copyright owner relicense or sell commercial
exceptions after accepting outside contributions.

## Consequences

**AGPL is not a non-compete.** A competitor may legally host Echo commercially,
including a modified Echo, provided they publish their modifications. AGPL
guarantees reciprocity, not exclusivity. Licenses that do provide a non-compete —
BSL 1.1, FSL — were considered and rejected: neither is open source under the OSI
definition, and for a product aimed at an independent-musician community, being
genuinely open source is worth more than the stronger moat.

**Accepting a single external contribution ends the relicensing option.** Without
a CLA, each contributor retains copyright over their patch. Once outside code is
merged, the project cannot be relicensed, dual-licensed, or offered under a
commercial exception without tracking down every contributor for consent. If
outside contributions ever become desirable, the CLA-or-not question must be
settled *before* the first merge, not after.

**`-only` freezes the version once contributions arrive.** The same mechanism
applies to license *upgrades*. While copyright is held by one person, moving to a
hypothetical AGPLv4 is a unilateral choice. After the first external
contribution, it requires unanimous consent.

**Section 13 imposes a runtime obligation that is not yet met.** A deployed Echo
instance must offer its users the Corresponding Source. The web application does
not do this today. Tracked separately; the intended fix is a source link in the
UI, pinned to the deployed commit rather than pointing at a bare repository URL.

**Inbound dependencies must stay AGPL-compatible.** Permissive licenses (MIT,
ISC, BSD, Apache-2.0) and MPL-2.0 flow in without friction. GPL-2.0-only code
does not and would be a genuine conflict. A dependency audit at the time of this
decision found no incompatible licenses across ~930 packages. One
GPL-3.0-or-later package (`webaudiofont`) was present as an unused leftover from
an earlier product direction and was removed — it was compatible, but any GPL
code in the bundle constrains relicensing even with a clean copyright chain. An
automated check in CI is tracked separately.

**The frontend ships under AGPL to every visitor.** This is a consequence of
being a web app, not a cost of this decision — but it means the client bundle and
its dependency tree are subject to the same obligations as the server.
