import { describe, expect, it } from "vitest";
import { makeDbAdapter } from "@echo/db";
import { NotFoundError } from "@echo/errors";
import { createOrganizationScope } from "@echo/modules/shared/domain";
import type { GetSongByIdQueryPort } from "../infrastructure/get-song-by-id.query.port.js";
import { getSongById } from "./get-song-by-id.js";

const scope = createOrganizationScope("org-1");

const { db } = makeDbAdapter({
  host: "localhost",
  port: 5432,
  user: "test",
  password: "test",
  name: "test",
});

describe("getSongById", () => {
  it("throws NotFoundError when the song doesn't exist", async () => {
    const getSongByIdQuery: GetSongByIdQueryPort = async () => undefined;

    await expect(
      getSongById({ db, getSongByIdQuery }, { songId: "missing", scope }),
    ).rejects.toBeInstanceOf(NotFoundError);
  });
});
