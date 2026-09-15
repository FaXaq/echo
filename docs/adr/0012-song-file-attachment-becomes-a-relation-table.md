# Song↔File attachment becomes a relation table (Song File Link), not a `songId` FK

ECH-108 (Song audio versions with history) needs a File to be taggable as a Song's "demo" or "final" audio, on top of the existing plain attachment. That surfaced a real need for a File to belong to more than one Song at once — tagging one Song's version doesn't stop the same file being a plain attachment elsewhere — which a single nullable `file.songId` FK cannot express. `file.songId` is dropped; a `song_file` relation table (`songId`, `fileId`, `role: "demo" | "final" | null`, `linkedAt`, `linkedBy`) takes its place, letting a File link to any number of Songs, each link independently and optionally tagged with a Role. `file.eventId` is untouched — a File still attaches to at most one Event.

This generalizes ADR-0009's orphan-protection rule (a file is destroyed only once nothing references it) from "at most one Song" to "any number of Songs": a File's row and S3 object are deleted only once its `eventId` is null and it has zero Song File Links.

## Considered Options

Kept `file.songId` as-is and added a separate table just for demo/final tagging, leaving plain Song attachment untouched. Rejected: two different mechanisms would then decide whether a file is "on" a Song — the FK for plain attachments, a second table for tagged versions — and it still wouldn't solve the actual want, a file reused as a plain attachment across multiple Songs.
