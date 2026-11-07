import { describe, expect, it, vi } from "vitest";
import { fireEvent, render, screen } from "@/lib/test-utils";
import { AttachmentCarouselDialog } from "./attachment-carousel-dialog";

describe("AttachmentCarouselDialog", () => {
  it("replaces the loading placeholder with an error when the media fails to load", async () => {
    render(
      <AttachmentCarouselDialog
        files={[
          { id: "1", filename: "gone.jpeg", kind: "image", downloadUrl: "https://s3/gone.jpeg" },
        ]}
        openIndex={0}
        onOpenChange={vi.fn()}
      />,
    );

    fireEvent.error(await screen.findByRole("img", { name: "gone.jpeg" }));

    expect(await screen.findByRole("alert")).toHaveTextContent("Couldn't load this file");
  });
});
