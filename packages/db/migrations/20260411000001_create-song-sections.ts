import { Kysely, sql } from 'kysely';

export async function up(db: Kysely<any>): Promise<void> {
  await db.schema
    .createTable('songSectionDefinition')
    .addColumn('id', 'text', col => col.primaryKey())
    .addColumn('songId', 'text', col =>
      col.references('song.id').onDelete('cascade').notNull()
    )
    .addColumn('name', 'text', col => col.notNull())
    .addColumn('chords', 'jsonb', col => col.defaultTo(sql`'[]'::jsonb`).notNull())
    .addColumn('lyrics', 'text')
    .addColumn('color', 'text')
    .addColumn('createdAt', 'timestamp', col =>
      col.defaultTo(sql`now()`).notNull()
    )
    .addColumn('updatedAt', 'timestamp', col =>
      col.defaultTo(sql`now()`).notNull()
    )
    .execute();

  await db.schema
    .createIndex('idx_songSectionDefinition_songId')
    .on('songSectionDefinition')
    .column('songId')
    .execute();

  await db.schema
    .createTable('songSectionInstance')
    .addColumn('id', 'text', col => col.primaryKey())
    .addColumn('songId', 'text', col =>
      col.references('song.id').onDelete('cascade').notNull()
    )
    .addColumn('definitionId', 'text', col =>
      col.references('songSectionDefinition.id').onDelete('cascade').notNull()
    )
    .addColumn('startMeasure', 'double precision', col => col.notNull())
    .addColumn('lengthMeasures', 'double precision', col =>
      col.defaultTo(8).notNull()
    )
    .addColumn('lyricsOverride', 'text')
    .addColumn('createdAt', 'timestamp', col =>
      col.defaultTo(sql`now()`).notNull()
    )
    .addColumn('updatedAt', 'timestamp', col =>
      col.defaultTo(sql`now()`).notNull()
    )
    .execute();

  await db.schema
    .createIndex('idx_songSectionInstance_songId')
    .on('songSectionInstance')
    .column('songId')
    .execute();

  await db.schema
    .createIndex('idx_songSectionInstance_definitionId')
    .on('songSectionInstance')
    .column('definitionId')
    .execute();
}

export async function down(db: Kysely<any>): Promise<void> {
  await db.schema.dropTable('songSectionInstance').execute();
  await db.schema.dropTable('songSectionDefinition').execute();
}
