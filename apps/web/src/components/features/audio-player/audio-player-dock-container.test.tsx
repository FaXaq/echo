import { render, screen } from "@/lib/test-utils";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { useAudioPlayerStore } from "@/stores/audio-player-store";
import { AudioPlayerDockContainer } from "./audio-player-dock-container";

function renderWithFile() {
  const toggle = vi.fn();
  useAudioPlayerStore.setState({
    file: { id: "f1", filename: "demo.mp3", downloadUrl: "https://example.test/demo.mp3" },
    toggle,
  });
  render(
    <>
      <input aria-label="Title" />
      <AudioPlayerDockContainer />
    </>,
  );
  return toggle;
}

describe("AudioPlayerDockContainer", () => {
  it("toggles playback on space", async () => {
    const user = userEvent.setup();
    const toggle = renderWithFile();

    await user.keyboard(" ");

    expect(toggle).toHaveBeenCalledOnce();
  });

  it("leaves space alone while typing", async () => {
    const user = userEvent.setup();
    const toggle = renderWithFile();

    await user.type(screen.getByLabelText("Title"), " ");

    expect(toggle).not.toHaveBeenCalled();
  });
});
