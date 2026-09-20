import { sql, type Kysely } from "kysely";

export async function up(db: Kysely<unknown>): Promise<void> {
  await db.schema
    .createTable("outreach_card_contact")
    .addColumn("card_id", "text", (col) =>
      col.notNull().references("outreach_card.id").onDelete("cascade"),
    )
    .addColumn("contact_id", "text", (col) =>
      col.notNull().references("contact.id").onDelete("cascade"),
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
}
