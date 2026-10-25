import { fireEvent, render, screen } from "@/lib/test-utils";
import { describe, expect, it, vi } from "vitest";

vi.mock("@/components/features/song/song-upload-context", () => ({
  useSongUploadMutation: () => ({ mutate: vi.fn() }),
}));

import { SongDropZone } from "./-song-drop-zone";
import { SECTION_DRAG_TYPE } from "@/components/ui/song/structure/structure-timeline";

describe("SongDropZone", () => {
  it("ignores section drags", () => {
    render(
      <SongDropZone songId="s" organizationId="o">
        <div data-testid="inner" />
      </SongDropZone>,
    );
    fireEvent.dragOver(screen.getByTestId("inner"), {
      dataTransfer: { types: [SECTION_DRAG_TYPE] },
    });
    expect(screen.queryByText("Drop files to upload")).not.toBeInTheDocument();
  });

  it("shows the overlay for file drags", () => {
    render(
      <SongDropZone songId="s" organizationId="o">
        <div data-testid="inner" />
      </SongDropZone>,
    );
    fireEvent.dragOver(screen.getByTestId("inner"), { dataTransfer: { types: ["Files"] } });
    expect(screen.getByText("Drop files to upload")).toBeInTheDocument();
  });
});
