# `file.eventId`/`file.songId` use `onDelete("set null")`, not `cascade`

ECH-24 adds a nullable `file.songId` FK alongside the existing `file.eventId`, and a file can now be attached to an Event and a Song at the same time. `file.eventId` was originally `onDelete("cascade")` — deleting an Event deleted every attached `file` row outright. With dual attachment possible, that cascade became actively wrong: deleting a Song would destroy a file's row (and its S3 object) even if that same file was still attached to a live Event. Both FKs are changed to `onDelete("set null")`; deleting an Event or Song only clears that column. `deleteEvent`/`deleteSong` now check, per formerly-attached file, whether the file's other attachment column is also null before deleting its S3 object and row — a file is destroyed only once nothing references it.

## Considered Options

Keeping `cascade` and forbidding dual attachment (a file could only ever belong to one of Event/Song) was rejected — flagged during ECH-24 grilling as an artificial restriction with no product motivation, and one the file/attachment UI would have to actively enforce for no benefit.
