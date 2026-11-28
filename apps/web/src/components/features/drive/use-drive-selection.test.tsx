import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import type { DriveLocation } from "@echo/modules/drive/domain";
import { act, renderHook } from "@testing-library/react";
import { I18nProvider } from "@lingui/react";
import { i18n } from "@lingui/core";
import type { ReactNode } from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";

const moveFiles = vi.fn();
const moveFolders = vi.fn();

vi.mock("@/services/api-client", () => ({
  apiClient: {
    drive: {
      moveFiles: { mutate: (input: unknown) => moveFiles(input) },
      moveFolders: { mutate: (input: unknown) => moveFolders(input) },
    },
  },
}));

import { selectionKey } from "./drive-item-utils";
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

    expect(moveFiles).toHaveBeenCalledTimes(1);
  });

  it("moves a mixed selection with one request per item kind", async () => {
    const { result } = setup({ kind: "root" });
    act(() =>
      result.current.setSelectedKeys(
        new Set([
          selectionKey("file", "file-1"),
          selectionKey("file", "file-2"),
          selectionKey("folder", "folder-2"),
          selectionKey("folder", "folder-3"),
        ]),
      ),
    );

    await act(async () => result.current.handleDragEnd(dropFileOnFolder));

    expect(moveFiles).toHaveBeenCalledExactlyOnceWith({
      ids: ["file-1", "file-2"],
      organizationId: "org-1",
      from: { kind: "root" },
      folderId: "folder-1",
    });
    expect(moveFolders).toHaveBeenCalledExactlyOnceWith({
      ids: ["folder-2", "folder-3"],
      organizationId: "org-1",
      parentFolderId: "folder-1",
    });
  });

  it.each<DriveLocation>([
    { kind: "events" },
    { kind: "songs" },
    { kind: "event", id: "event-1" },
    { kind: "song", id: "song-1" },
  ])("never moves anything from the $kind location", async (location) => {
    const { result } = setup(location);

    await act(async () => result.current.handleDragEnd(dropFileOnFolder));

    expect(moveFiles).not.toHaveBeenCalled();
    expect(moveFolders).not.toHaveBeenCalled();
  });
});
