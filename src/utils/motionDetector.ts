import { MotionSensitivity } from '../types';

let lastFrameSample: Uint8ClampedArray | null = null;

export function detectMotionInFrame(
  imgData: ImageData,
  sensitivity: MotionSensitivity = 'medium'
): { hasMotion: boolean; intensity: number } {
  const data = imgData.data;
  const threshold = sensitivity === 'high' ? 18 : sensitivity === 'low' ? 38 : 28;
  const pixelThreshold = sensitivity === 'high' ? 0.02 : sensitivity === 'low' ? 0.07 : 0.04;

  if (!lastFrameSample || lastFrameSample.length !== data.length) {
    lastFrameSample = new Uint8ClampedArray(data);
    return { hasMotion: false, intensity: 0 };
  }

  let changed = 0;
  const total = data.length / 4;

  for (let i = 0; i < data.length; i += 16) {
    const diff =
      Math.abs(data[i] - lastFrameSample[i]) +
      Math.abs(data[i + 1] - lastFrameSample[i + 1]) +
      Math.abs(data[i + 2] - lastFrameSample[i + 2]);
    if (diff > threshold * 3) {
      changed++;
    }
  }

  for (let i = 0; i < data.length; i += 16) {
    lastFrameSample[i] = data[i];
    lastFrameSample[i + 1] = data[i + 1];
    lastFrameSample[i + 2] = data[i + 2];
  }

  const sampledTotal = total / 4;
  const intensity = Math.min(100, Math.round((changed / sampledTotal) * 100 * 5));
  const hasMotion = changed / sampledTotal > pixelThreshold;
  return { hasMotion, intensity };
}
