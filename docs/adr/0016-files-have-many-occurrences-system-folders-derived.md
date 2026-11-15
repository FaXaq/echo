# Files have many Occurrences; Event and Song folders are derived, not stored

ECH-152 makes a file appear in several places in the Drive without being duplicated — any number of Folders, Events and Songs — and deleted only once it's gone from all of them. Every place is an Occurrence, and every Occurrence protects the file equally. `file.event_id` becomes an `event_file` relation table (mirroring `song_file`), and `file.folder_id` becomes a `folder_file` placement table in which Drive root is an explicit placement (a null folder), so a file uploaded from an Event or Song page lives only there and doesn't also clutter root. A file's row and S3 objects are destroyed only when it has no `event_file`, `song_file` or `folder_file` row left.

The Drive's **Events** and **Songs** root folders, and the per-Event / per-Song folders inside them, are computed from `event_file` / `song_file` at read time, never stored as `folder` rows. Pasting into one creates the matching link; removing from one deletes it.

This supersedes ADR-0009 (a single `event_id` FK with `set null`) and generalizes ADR-0012's orphan rule from "Event + Songs" to every Occurrence. Folder placement, previously a location with no protecting effect, now protects too.

Migration: user-Folder placements are kept. Root placements are dropped for files that already have an Event or Song link — those files move out of root into their Event/Song folders — and kept for files with no link, which would otherwise have no Occurrence.

## Considered Options

- **Real `folder` rows per Event/Song**, created by a backfill and kept in sync on Event/Song rename and delete. Rejected: two sources of truth for "which files are on this Event" that can drift, plus sync code on every Event/Song mutation, for no user-visible gain.
- **Keep `file.event_id` single and reject pasting into a second Event folder.** Rejected: Copy/Paste would work for Songs but not Events, for no product reason — the same argument ADR-0012 made for Songs.
- **Keep root as "no folder" (`folder_id = null`).** Rejected: every Event/Song upload would also appear at root, and removing it from root would be impossible without detaching it elsewhere.
