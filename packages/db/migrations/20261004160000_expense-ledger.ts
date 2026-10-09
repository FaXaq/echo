import { sql, type Kysely } from "kysely";

export async function up(db: Kysely<unknown>): Promise<void> {
  await db.schema
    .createTable("expense")
    .addColumn("id", "text", (col) => col.primaryKey().notNull())
    .addColumn("organization_id", "text", (col) =>
      col.notNull().references("organization.id").onDelete("cascade"),
    )
    .addColumn("title", "text", (col) => col.notNull())
    .addColumn("description", "text")
    .addColumn("paid_on", "date", (col) => col.notNull())
    .addColumn("amount_minor", "integer", (col) => col.notNull())
    .addColumn("currency", "text", (col) => col.notNull())
    .addColumn("exchange_rate", "numeric")
    .addColumn("converted_amount_minor", "integer", (col) => col.notNull())
    .addColumn("split_mode", "text", (col) => col.notNull())
    .addColumn("payer_id", "text", (col) => col.notNull().references("user.id"))
    .addColumn("event_id", "text", (col) =>
      col.references("calendar_event.id").onDelete("set null"),
    )
    .addColumn("created_by", "text", (col) => col.notNull().references("user.id"))
    .addColumn("updated_by", "text", (col) => col.references("user.id").onDelete("set null"))
    .addColumn("created_at", "timestamptz", (col) => col.notNull().defaultTo(sql`now()`))
    .addColumn("updated_at", "timestamptz", (col) => col.defaultTo(sql`now()`))
    .addCheckConstraint("expense_amount_minor_positive", sql`amount_minor > 0`)
    .addCheckConstraint("expense_converted_amount_minor_positive", sql`converted_amount_minor > 0`)
    .addCheckConstraint("expense_split_mode_valid", sql`split_mode in ('equal', 'exact')`)
    .execute();

  await db.schema
    .createIndex("expense_organization_id_paid_on_index")
    .on("expense")
    .columns(["organization_id", "paid_on"])
    .execute();

  await db.schema.createIndex("expense_event_id_index").on("expense").column("event_id").execute();

  await db.schema
    .createTable("expense_share")
    .addColumn("expense_id", "text", (col) =>
      col.notNull().references("expense.id").onDelete("cascade"),
    )
    .addColumn("user_id", "text", (col) => col.notNull().references("user.id"))
    .addColumn("amount_minor", "integer", (col) => col.notNull())
    .addColumn("converted_amount_minor", "integer", (col) => col.notNull())
    .addPrimaryKeyConstraint("expense_share_pkey", ["expense_id", "user_id"])
    .addCheckConstraint("expense_share_amount_minor_positive", sql`amount_minor > 0`)
    .execute();

  await db.schema
    .createIndex("expense_share_user_id_index")
    .on("expense_share")
    .column("user_id")
    .execute();

  await db.schema
    .createTable("repayment")
    .addColumn("id", "text", (col) => col.primaryKey().notNull())
    .addColumn("organization_id", "text", (col) =>
      col.notNull().references("organization.id").onDelete("cascade"),
    )
    .addColumn("from_user_id", "text", (col) => col.notNull().references("user.id"))
    .addColumn("to_user_id", "text", (col) => col.notNull().references("user.id"))
    .addColumn("amount_minor", "integer", (col) => col.notNull())
    .addColumn("paid_on", "date", (col) => col.notNull())
    .addColumn("note", "text")
    .addColumn("created_by", "text", (col) => col.notNull().references("user.id"))
    .addColumn("created_at", "timestamptz", (col) => col.notNull().defaultTo(sql`now()`))
    .addCheckConstraint("repayment_amount_minor_positive", sql`amount_minor > 0`)
    .addCheckConstraint("repayment_distinct_users", sql`from_user_id <> to_user_id`)
    .execute();

  await db.schema
    .createIndex("repayment_organization_id_index")
    .on("repayment")
    .column("organization_id")
    .execute();
}

export async function down(db: Kysely<unknown>): Promise<void> {
  await db.schema.dropTable("repayment").execute();
  await db.schema.dropTable("expense_share").execute();
  await db.schema.dropTable("expense").execute();
}
