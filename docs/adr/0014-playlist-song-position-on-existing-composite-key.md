# Playlist song ordering uses a position column on the existing composite key, not a surrogate row id

`playlist_song` keeps its `(playlist_id, song_id)` composite primary key and gains a `position: real` column (mirroring `outreach_card`/`outreach_column`), rather than switching to a surrogate `id` primary key. ECH-106 originally bundled manual reordering with allowing duplicate songs in a playlist, and duplicates are the reason a surrogate id would be needed — without them, the composite key already gives every row the identity a drag-and-drop reorder requires. We're shipping reordering alone; duplicate songs stay unscoped until actually needed.

## Considered Options

- **Surrogate `id` PK now**, sized for both reordering and future duplicates in one migration. Rejected: pays for a feature (duplicates) nobody asked for yet, and the composite key is not hard to migrate away from later if duplicates do get scoped.
