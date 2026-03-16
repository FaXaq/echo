import { Kysely, sql } from 'kysely';

export async function up(db: Kysely<any>): Promise<void> {
  // Add instrumentPreset column to track
  await db.schema
    .alterTable('track')
    .addColumn('instrumentPreset', 'integer')
    .execute();

  // Convert track.volume from INTEGER (0-100) to FLOAT (dB, -60 to +6)
  await sql`ALTER TABLE track ALTER COLUMN volume TYPE double precision USING CASE WHEN volume = 0 THEN -60.0 ELSE 20.0 * LOG(volume::float / 100.0) / LOG(10.0) END`.execute(db);

  // Set default to 0.0 dB
  await sql`ALTER TABLE track ALTER COLUMN volume SET DEFAULT 0.0`.execute(db);

  // Create midiClip table (camelCase column names to match project convention)
  await db.schema
    .createTable('midiClip')
    .addColumn('id', 'text', col => col.primaryKey())
    .addColumn('trackId', 'text', col =>
      col.references('track.id').onDelete('cascade').notNull()
    )
    .addColumn('fileId', 'text', col =>
      col.references('file.id').onDelete('restrict').notNull()
    )
    .addColumn('name', 'text')
    .addColumn('startMeasure', 'double precision', col => col.defaultTo(1.0).notNull())
    .addColumn('durationMs', 'integer')
    .addColumn('createdAt', 'timestamp', col =>
      col.defaultTo(sql`now()`).notNull()
    )
    .execute(); 

  // Create index for queries
  await db.schema
    .createIndex('idx_midiClip_trackId')
    .on('midiClip')
    .column('trackId')
    .execute();
}

export async function down(db: Kysely<any>): Promise<void> {
  // Drop midiClip table
  await db.schema.dropTable('midiClip').execute();

  // Reverse volume conversion: dB → 0-100 scale
  await sql`ALTER TABLE track ALTER COLUMN volume TYPE INTEGER USING CASE WHEN volume <= -60 THEN 0 ELSE ROUND(100.0 * POWER(10.0, volume / 20.0)) END`.execute(db);

  // Restore old default
  await sql`ALTER TABLE track ALTER COLUMN volume SET DEFAULT 80`.execute(db);

  // Drop instrumentPreset column
  await db.schema
    .alterTable('track')
    .dropColumn('instrumentPreset')
    .execute();
}
