import { describe, expect, it } from "vitest";
import { ForbiddenError } from "@echo/errors";
import { createOrganizationScope } from "@echo/modules/shared/domain";
import type { InsertContactCommandPort } from "../infrastructure/insert-contact.command.port.js";
import { createContact } from "./create-contact.js";
import { makeFakeContact, makeFakeDb, makeFakePermissionChecks } from "./test-fixtures.js";

const scope = createOrganizationScope("org-1");

describe("createContact", () => {
  it("rejects a member without contact:create permission", async () => {
    const insertContactCommand: InsertContactCommandPort = async () => makeFakeContact();

    await expect(
      createContact(
        {
          db: makeFakeDb(),
          insertContactCommand,
          ...makeFakePermissionChecks({
            userHasPermissionInOrganization: async () => ({
              success: false,
              error: null,
              role: null,
            }),
          }),
        },
        { scope, name: "Jamie Booker", phone: null, email: null, description: null },
      ),
    ).rejects.toBeInstanceOf(ForbiddenError);
  });

  it("inserts the contact when permission succeeds", async () => {
    const inserted: unknown[] = [];
    const insertContactCommand: InsertContactCommandPort = async (_db, _scope, input) => {
      inserted.push(input);
      return makeFakeContact({ name: input.name });
    };

    const result = await createContact(
      { db: makeFakeDb(), insertContactCommand, ...makeFakePermissionChecks() },
      { scope, name: "Jamie Booker", phone: "0600000000", email: null, description: null },
    );

    expect(inserted).toEqual([
      {
        id: expect.any(String),
        name: "Jamie Booker",
        phone: "0600000000",
        email: null,
        description: null,
      },
    ]);
    expect(result.name).toBe("Jamie Booker");
  });
});
