import { sql, type Kysely } from "kysely";

export async function up(db: Kysely<unknown>): Promise<void> {
  await db.schema
    .createTable("outreach_column")
    .addColumn("id", "text", (col) => col.primaryKey().notNull())
    .addColumn("organization_id", "text", (col) =>
      col.notNull().references("organization.id").onDelete("cascade"),
    )
    .addColumn("name", "text", (col) => col.notNull())
    .addColumn("position", "real", (col) => col.notNull())
    .addColumn("created_at", "timestamptz", (col) => col.notNull().defaultTo(sql`now()`))
    .addColumn("updated_at", "timestamptz", (col) => col.defaultTo(sql`now()`))
    .execute();

  await db.schema
    .createIndex("outreach_column_organization_id_index")
    .on("outreach_column")
    .column("organization_id")
    .execute();

  await db.schema
    .createTable("outreach_card")
    .addColumn("id", "text", (col) => col.primaryKey().notNull())
    .addColumn("organization_id", "text", (col) =>
      col.notNull().references("organization.id").onDelete("cascade"),
    )
    .addColumn("column_id", "text", (col) =>
      col.notNull().references("outreach_column.id").onDelete("cascade"),
    )
    .addColumn("title", "text", (col) => col.notNull())
    .addColumn("position", "real", (col) => col.notNull())
    .addColumn("place_name", "text")
    .addColumn("place_address", "text")
    .addColumn("place_lat", "double precision")
    .addColumn("place_lng", "double precision")
    .addColumn("description", "text")
    .addColumn("assignee_id", "text", (col) => col.references("user.id").onDelete("set null"))
    .addColumn("created_by", "text", (col) =>
      col.notNull().references("user.id").onDelete("cascade"),
    )
    .addColumn("updated_by", "text", (col) => col.references("user.id").onDelete("set null"))
    .addColumn("created_at", "timestamptz", (col) => col.notNull().defaultTo(sql`now()`))
    .addColumn("updated_at", "timestamptz", (col) => col.defaultTo(sql`now()`))
    .execute();

  await db.schema
    .createIndex("outreach_card_organization_id_index")
    .on("outreach_card")
    .column("organization_id")
    .execute();

  await db.schema
    .createIndex("outreach_card_column_id_index")
    .on("outreach_card")
    .column("column_id")
    .execute();

  await db.schema
    .createTable("outreach_contact")
    .addColumn("id", "text", (col) => col.primaryKey().notNull())
    .addColumn("organization_id", "text", (col) =>
      col.notNull().references("organization.id").onDelete("cascade"),
    )
    .addColumn("name", "text", (col) => col.notNull())
    .addColumn("phone", "text")
    .addColumn("email", "text")
    .addColumn("description", "text")
    .addColumn("created_at", "timestamptz", (col) => col.notNull().defaultTo(sql`now()`))
    .addColumn("updated_at", "timestamptz", (col) => col.defaultTo(sql`now()`))
    .execute();

  await db.schema
    .createIndex("outreach_contact_organization_id_index")
    .on("outreach_contact")
    .column("organization_id")
    .execute();

  await db.schema
    .createTable("outreach_card_contact")
    .addColumn("card_id", "text", (col) =>
      col.notNull().references("outreach_card.id").onDelete("cascade"),
    )
    .addColumn("contact_id", "text", (col) =>
      col.notNull().references("outreach_contact.id").onDelete("cascade"),
    )
    .addColumn("created_at", "timestamptz", (col) => col.notNull().defaultTo(sql`now()`))
    .addPrimaryKeyConstraint("outreach_card_contact_pkey", ["card_id", "contact_id"])
    .execute();

  await db.schema
    .createIndex("outreach_card_contact_contact_id_index")
    .on("outreach_card_contact")
    .column("contact_id")
    .execute();
}

export async function down(db: Kysely<unknown>): Promise<void> {
  await db.schema.dropTable("outreach_card_contact").execute();
  await db.schema.dropTable("outreach_contact").execute();
  await db.schema.dropTable("outreach_card").execute();
  await db.schema.dropTable("outreach_column").execute();
}
