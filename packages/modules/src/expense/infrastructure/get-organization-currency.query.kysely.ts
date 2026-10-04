import { DEFAULT_CURRENCY } from "../domain/index.js";
import type { GetOrganizationCurrencyQueryPortFactory } from "./get-organization-currency.query.port.js";

export const getOrganizationCurrencyQueryFactory: GetOrganizationCurrencyQueryPortFactory =
  () => async (db, scope) => {
    const row = await db
      .selectFrom("organization")
      .select("currency")
      .where("id", "=", scope.organizationId)
      .executeTakeFirst();
    return row?.currency ?? DEFAULT_CURRENCY;
  };
