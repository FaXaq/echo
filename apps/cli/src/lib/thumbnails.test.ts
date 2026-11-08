import sharp from "sharp";
import { afterEach, describe, expect, it, vi } from "vitest";
import { fetchBytes } from "./fetch-bytes";
import { captureVideoFrame, frameArgs, putBytes, resizeImage } from "./thumbnails";

const signedUrl = "http://127.0.0.1:9/v.mp4?X-Amz-Signature=secret";

afterEach(() => vi.unstubAllGlobals());

describe("resizeImage", () => {
  it("resizes the shortest side to 480 and flattens transparency", async () => {
    const input = await sharp({
      create: {
        width: 1000,
        height: 800,
        channels: 4,
        background: { r: 0, g: 0, b: 0, alpha: 0 },
      },
    })
      .png()
      .toBuffer();

    const output = await resizeImage(input);

    expect(await sharp(output).metadata()).toMatchObject({
      format: "jpeg",
      width: 600,
      height: 480,
    });
    const { data } = await sharp(output).raw().toBuffer({ resolveWithObject: true });
    expect(data[0]).toBeGreaterThan(250);
  });

  it("never enlarges", async () => {
    const input = await sharp({
      create: { width: 300, height: 200, channels: 3, background: "red" },
    })
      .png()
      .toBuffer();

    expect(await sharp(await resizeImage(input)).metadata()).toMatchObject({
      width: 300,
      height: 200,
    });
  });

  it("uses the first frame of an animated gif", async () => {
    const frame = (background: string) =>
      sharp({ create: { width: 10, height: 10, channels: 3, background } })
        .png()
        .toBuffer();
    const input = await sharp([await frame("red"), await frame("blue")], {
      join: { animated: true },
    })
      .gif()
      .toBuffer();
    expect((await sharp(input, { animated: true }).metadata()).pages).toBe(2);

    const output = await resizeImage(input);

    expect(await sharp(output).metadata()).toMatchObject({
      format: "jpeg",
      width: 10,
      height: 10,
    });
    const { data } = await sharp(output).raw().toBuffer({ resolveWithObject: true });
    expect(data[0]).toBeGreaterThan(200);
    expect(data[2]).toBeLessThan(80);
  });
});

describe("frameArgs", () => {
  it("only lets ffmpeg read known media containers", () => {
    const args = frameArgs(signedUrl, 1);

    expect(args[args.indexOf("-format_whitelist") + 1]).toBe("mov,matroska");
    expect(args.indexOf("-format_whitelist")).toBeLessThan(args.indexOf("-i"));
  });
});

describe("signed URLs in errors", () => {
  it("does not include the signed URL in ffmpeg errors", async () => {
    await expect(captureVideoFrame(signedUrl)).rejects.not.toThrow(/secret/);
  });

  it("does not include the signed URL in upload errors", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(async () => new Response("", { status: 403 })),
    );

    await expect(putBytes(signedUrl, new Uint8Array([1]), "image/jpeg")).rejects.not.toThrow(
      /secret/,
    );
  });

  it("does not include the signed URL in download errors", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(async () => new Response("", { status: 404 })),
    );

    await expect(fetchBytes(signedUrl)).rejects.not.toThrow(/secret/);
  });
});
