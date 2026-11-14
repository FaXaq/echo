import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import type { DriveLocation } from "@echo/modules/drive/domain";
import { act, renderHook } from "@testing-library/react";
import { I18nProvider } from "@lingui/react";
import { i18n } from "@lingui/core";
import type { ReactNode } from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";

const moveFile = vi.fn();
const moveFolder = vi.fn();

vi.mock("@/services/api-client", () => ({
  apiClient: {
    drive: {
      moveFile: { mutate: (input: unknown) => moveFile(input) },
      moveFolder: { mutate: (input: unknown) => moveFolder(input) },
    },
  },
}));

import { useDriveSelection } from "./use-drive-selection";

function setup(location: DriveLocation) {
  const client = new QueryClient();
  const wrapper = ({ children }: { children: ReactNode }) => (
    <I18nProvider i18n={i18n}>
      <QueryClientProvider client={client}>{children}</QueryClientProvider>
    </I18nProvider>
  );
  return renderHook(
    () =>
      useDriveSelection({
        organizationId: "org-1",
        location,
        rows: [],
        visibleFolders: [],
        visibleFiles: [],
      }),
    { wrapper },
  );
}

const dropFileOnFolder = {
  operation: {
    source: { data: { kind: "file", id: "file-1" } },
    target: { data: { kind: "folder", id: "folder-1" } },
  },
};

describe("useDriveSelection drag to move", () => {
  beforeEach(() => vi.clearAllMocks());

  it("moves files dropped on a folder from a user location", async () => {
    const { result } = setup({ kind: "root" });

    await act(async () => result.current.handleDragEnd(dropFileOnFolder));

    expect(moveFile).toHaveBeenCalledTimes(1);
  });

  it.each<DriveLocation>([
    { kind: "events" },
    { kind: "songs" },
    { kind: "event", id: "event-1" },
    { kind: "song", id: "song-1" },
  ])("never moves anything from the $kind location", async (location) => {
    const { result } = setup(location);

    await act(async () => result.current.handleDragEnd(dropFileOnFolder));

    expect(moveFile).not.toHaveBeenCalled();
    expect(moveFolder).not.toHaveBeenCalled();
  });
});
