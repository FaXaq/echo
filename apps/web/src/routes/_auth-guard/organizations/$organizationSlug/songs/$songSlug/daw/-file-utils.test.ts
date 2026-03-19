import { describe, it, expect } from "vitest";
import { detectFileTypeFromFile } from "./-file-utils";

// Note: detectFileTypeFromItems requires DataTransferItemList (browser API) so it is
// tested via jsdom integration. detectFileTypeFromFile and getAudioDurationMs are the
// two most important pure functions to cover.

describe("detectFileTypeFromFile", () => {
  function makeFile(name: string, type: string): File {
    return new File([], name, { type });
  }

  it("detects audio/wav by MIME type", () => {
    expect(detectFileTypeFromFile(makeFile("track.wav", "audio/wav"))).toBe("audio");
  });

  it("detects audio/mpeg by MIME type", () => {
    expect(detectFileTypeFromFile(makeFile("track.mp3", "audio/mpeg"))).toBe("audio");
  });

  it("detects MIDI by audio/midi MIME type", () => {
    expect(detectFileTypeFromFile(makeFile("track.mid", "audio/midi"))).toBe("midi");
  });

  it("detects MIDI by audio/x-midi MIME type", () => {
    expect(detectFileTypeFromFile(makeFile("track.mid", "audio/x-midi"))).toBe("midi");
  });

  it("detects MIDI by .mid extension when MIME is empty", () => {
    expect(detectFileTypeFromFile(makeFile("track.mid", ""))).toBe("midi");
  });

  it("detects MIDI by .midi extension", () => {
    expect(detectFileTypeFromFile(makeFile("song.midi", ""))).toBe("midi");
  });

  it("detects audio by .wav extension when MIME is empty", () => {
    expect(detectFileTypeFromFile(makeFile("track.wav", ""))).toBe("audio");
  });

  it("detects audio by .flac extension", () => {
    expect(detectFileTypeFromFile(makeFile("track.flac", ""))).toBe("audio");
  });

  it("detects audio by .ogg extension", () => {
    expect(detectFileTypeFromFile(makeFile("track.ogg", ""))).toBe("audio");
  });

  it("returns null for unknown type", () => {
    expect(detectFileTypeFromFile(makeFile("document.pdf", "application/pdf"))).toBeNull();
  });

  it("returns null for text files", () => {
    expect(detectFileTypeFromFile(makeFile("notes.txt", "text/plain"))).toBeNull();
  });

  it("MIDI takes precedence over generic audio/ MIME prefix when extension is .mid", () => {
    // Some browsers may report audio/x-midi for .mid files
    expect(detectFileTypeFromFile(makeFile("beat.mid", "audio/x-midi"))).toBe("midi");
  });
});
