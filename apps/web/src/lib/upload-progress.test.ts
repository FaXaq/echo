import { describe, expect, it } from "vitest";
import {
  getUploadDuration,
  getUploadProgress,
  setUploadDuration,
  setUploadProgress,
  startUpload,
  stopUpload,
  totalUploadRatio,
} from "./upload-progress.js";

describe("upload progress", () => {
  it("tracks progress per file, undefined until the transfer starts", () => {
    const file = new File(["a"], "a.wav");

    expect(getUploadProgress(file)).toBeUndefined();
    setUploadProgress(file, 0.4);
    expect(getUploadProgress(file)).toBe(0.4);
  });

  it("forgets progress on start so a retry starts as not started", () => {
    const file = new File(["a"], "a.wav");

    setUploadProgress(file, 1);
    startUpload(file);
    expect(getUploadProgress(file)).toBeUndefined();
  });

  it("stops the latest upload of a file", () => {
    const file = new File(["a"], "a.wav");

    const first = startUpload(file);
    const retry = startUpload(file);
    stopUpload(file);
    expect(first.signal.aborted).toBe(false);
    expect(retry.signal.aborted).toBe(true);
  });

  it("remembers the duration read before the upload, defaulting to null", () => {
    const file = new File(["a"], "a.wav");

    expect(getUploadDuration(file)).toBeNull();
    setUploadDuration(file, 222);
    expect(getUploadDuration(file)).toBe(222);
  });

  it("weights the total by file size", () => {
    expect(
      totalUploadRatio([
        { sizeBytes: 900, ratio: 1 },
        { sizeBytes: 100, ratio: 0 },
      ]),
    ).toBe(0.9);
  });

  it("is 0 when there is nothing to upload", () => {
    expect(totalUploadRatio([])).toBe(0);
  });
});
