import { describe, expect, it } from "vitest"
import { computeWaveformPeaks } from "./audio-waveform"

describe("computeWaveformPeaks", () => {
  it("buckets samples into the requested number of peaks, taking max abs per bucket", () => {
    const data = new Float32Array([0, 0.2, -0.5, 0.1, 0.9, -0.9, 0.3, 0.1])
    const peaks = computeWaveformPeaks(data, 4)
    expect(peaks.length).toBe(4)
    expect(peaks[0]).toBeCloseTo(0.2)
    expect(peaks[1]).toBeCloseTo(0.5)
    expect(peaks[2]).toBeCloseTo(0.9)
    expect(peaks[3]).toBeCloseTo(0.3)
  })

  it("returns zeroed peaks for silence", () => {
    const data = new Float32Array(100)
    const peaks = computeWaveformPeaks(data, 10)
    expect(peaks).toEqual(new Array(10).fill(0))
  })

  it("does not crash on empty channel data", () => {
    const peaks = computeWaveformPeaks(new Float32Array(0), 8)
    expect(peaks).toEqual(new Array(8).fill(0))
  })
})
