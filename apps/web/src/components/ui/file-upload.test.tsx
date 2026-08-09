import { render, screen, fireEvent } from "@/lib/test-utils";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { FileUpload } from "./file-upload";

function makeFile(name = "demo.mp3", type = "audio/mpeg") {
  return new File(["content"], name, { type });
}

describe("FileUpload", () => {
  it("calls onFilesSelected when a file is picked via the input", async () => {
    const user = userEvent.setup();
    const onFilesSelected = vi.fn();
    render(<FileUpload onFilesSelected={onFilesSelected} />);

    const input = screen.getByLabelText("Add files", { selector: "input" });
    await user.upload(input, makeFile());

    expect(onFilesSelected).toHaveBeenCalledWith([expect.objectContaining({ name: "demo.mp3" })]);
  });

  it("calls onFilesSelected when a file is dropped", () => {
    const onFilesSelected = vi.fn();
    render(<FileUpload onFilesSelected={onFilesSelected} />);

    const dropzone = screen.getByRole("button");
    fireEvent.drop(dropzone, { dataTransfer: { files: [makeFile("cover.png", "image/png")] } });

    expect(onFilesSelected).toHaveBeenCalledWith([expect.objectContaining({ name: "cover.png" })]);
  });

  it("does not call onFilesSelected when disabled", () => {
    const onFilesSelected = vi.fn();
    render(<FileUpload disabled onFilesSelected={onFilesSelected} />);

    const dropzone = screen.getByRole("button");
    fireEvent.drop(dropzone, { dataTransfer: { files: [makeFile()] } });

    expect(onFilesSelected).not.toHaveBeenCalled();
  });
});
