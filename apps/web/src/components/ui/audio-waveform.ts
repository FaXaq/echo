export function computeWaveformPeaks(channelData: Float32Array, bucketCount: number): number[] {
  const bucketSize = Math.floor(channelData.length / bucketCount) || 1
  const peaks: number[] = []

  for (let i = 0; i < bucketCount; i++) {
    const start = i * bucketSize
    const end = Math.min(start + bucketSize, channelData.length)
    let max = 0
    for (let j = start; j < end; j++) {
      const abs = Math.abs(channelData[j])
      if (abs > max) max = abs
    }
    peaks.push(max)
  }

  return peaks
}
