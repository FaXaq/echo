import { describe, expect, it } from "vitest";
import { ConflictError } from "@echo/errors";
import { createOrganization } from "./create-organization.js";
import type { CreateOrganizationCommandPort } from "../infrastructure/create-organization.command.port";

const baseInput = { name: "My Band", userId: "user-1" };

describe("createOrganization", () => {
  it("passes isPersonal through to the command", async () => {
    const calls: Parameters<CreateOrganizationCommandPort>[0][] = [];
    const createOrganizationCommand: CreateOrganizationCommandPort = async (input) => {
      calls.push(input);
      return { status: "created", organization: { id: "org-1", name: input.name } };
    };

    await createOrganization({ createOrganizationCommand }, { ...baseInput, isPersonal: true });

    expect(calls[0]?.isPersonal).toBe(true);
  });

  it("omits isPersonal when not provided", async () => {
    const calls: Parameters<CreateOrganizationCommandPort>[0][] = [];
    const createOrganizationCommand: CreateOrganizationCommandPort = async (input) => {
      calls.push(input);
      return { status: "created", organization: { id: "org-1", name: input.name } };
    };

    await createOrganization({ createOrganizationCommand }, baseInput);

    expect(calls[0]?.isPersonal).toBeUndefined();
  });

  it("retries with a fresh slug when the slug is taken", async () => {
    let attempts = 0;
    const seenSlugs: string[] = [];
    const createOrganizationCommand: CreateOrganizationCommandPort = async (input) => {
      attempts++;
      seenSlugs.push(input.slug);
      if (attempts < 3) return { status: "slug_taken" };
      return { status: "created", organization: { id: "org-1", name: input.name } };
    };

    const organization = await createOrganization({ createOrganizationCommand }, baseInput);

    expect(attempts).toBe(3);
    expect(new Set(seenSlugs).size).toBe(3);
    expect(organization).toEqual({ id: "org-1", name: baseInput.name });
  });

  it("throws a ConflictError after exhausting all slug attempts", async () => {
    const createOrganizationCommand: CreateOrganizationCommandPort = async () => ({
      status: "slug_taken",
    });

    await expect(
      createOrganization({ createOrganizationCommand }, baseInput),
    ).rejects.toBeInstanceOf(ConflictError);
  });
});
