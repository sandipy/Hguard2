import { MotionSensitivity } from '../types';

export interface MotionAnalysisResult {
  hasMotion: boolean;
  score: number; // 0 to 100
  deltaPixelCount: number;
  centroidY: number; // 0.0 (top) to 1.0 (bottom / floor level)
  isFloorMotion: boolean; // True if motion is centered in bottom 40% of frame
  ambientLuminance: number; // 0 to 100 normalized light percentage
  isLowLight: boolean; // True when ambient luminance is low (<= 35%)
  isPitchDark: boolean; // True when room is near pitch dark (<= 15%)
}

export class MotionDetector {
  private prevFrameData: Uint8ClampedArray | null = null;
  private width: number = 120; // Reduced downscale width to preserve old phone CPU
  private height: number = 90; // Reduced downscale height
  private offscreenCanvas: HTMLCanvasElement;
  private offscreenCtx: CanvasRenderingContext2D | null;

  constructor() {
    this.offscreenCanvas = document.createElement('canvas');
    this.offscreenCanvas.width = this.width;
    this.offscreenCanvas.height = this.height;
    this.offscreenCtx = this.offscreenCanvas.getContext('2d', { willReadFrequently: true });
  }

  public analyzeFrame(
    videoEl: HTMLVideoElement,
    sensitivity: MotionSensitivity,
    zone: 'full' | 'center' = 'full',
    lowLightThreshold: number = 35,
    pitchDarkThreshold: number = 15
  ): MotionAnalysisResult {
    if (!this.offscreenCtx || videoEl.readyState < 2) {
      return {
        hasMotion: false,
        score: 0,
        deltaPixelCount: 0,
        centroidY: 0,
        isFloorMotion: false,
        ambientLuminance: 50,
        isLowLight: false,
        isPitchDark: false,
      };
    }

    // Draw downscaled frame
    this.offscreenCtx.drawImage(videoEl, 0, 0, this.width, this.height);
    const imgData = this.offscreenCtx.getImageData(0, 0, this.width, this.height);
    const data = imgData.data;

    // Determine bounds based on zone
    const minX = zone === 'center' ? Math.floor(this.width * 0.25) : 0;
    const maxX = zone === 'center' ? Math.floor(this.width * 0.75) : this.width;
    const minY = zone === 'center' ? Math.floor(this.height * 0.25) : 0;
    const maxY = zone === 'center' ? Math.floor(this.height * 0.75) : this.height;

    let changedPixels = 0;
    let totalSampled = 0;
    let sumY = 0;
    let sumLuminance = 0;

    // Threshold per pixel difference
    const pixelDiffThreshold = sensitivity === 'high' ? 24 : sensitivity === 'medium' ? 36 : 48;

    if (!this.prevFrameData) {
      // First frame: measure baseline ambient luminance
      for (let y = minY; y < maxY; y += 2) {
        for (let x = minX; x < maxX; x += 2) {
          const i = (y * this.width + x) * 4;
          totalSampled++;
          const currentGray = (data[i] * 3 + data[i + 1] * 4 + data[i + 2]) >> 3;
          sumLuminance += currentGray;
        }
      }
      this.prevFrameData = new Uint8ClampedArray(data);
      const rawAvg = totalSampled > 0 ? sumLuminance / totalSampled : 128;
      const ambientLuminance = Math.max(0, Math.min(100, Math.round((rawAvg / 255) * 100)));
      return {
        hasMotion: false,
        score: 0,
        deltaPixelCount: 0,
        centroidY: 0.5,
        isFloorMotion: false,
        ambientLuminance,
        isLowLight: ambientLuminance <= lowLightThreshold,
        isPitchDark: ambientLuminance <= pitchDarkThreshold,
      };
    }

    for (let y = minY; y < maxY; y += 2) { // Skip every other row to save CPU
      for (let x = minX; x < maxX; x += 2) {
        const i = (y * this.width + x) * 4;
        totalSampled++;

        // Grayscale conversion approximation (Luminance)
        const currentGray = (data[i] * 3 + data[i + 1] * 4 + data[i + 2]) >> 3;
        sumLuminance += currentGray;
        const prevGray = (this.prevFrameData[i] * 3 + this.prevFrameData[i + 1] * 4 + this.prevFrameData[i + 2]) >> 3;

        if (Math.abs(currentGray - prevGray) > pixelDiffThreshold) {
          changedPixels++;
          sumY += y;
        }
      }
    }

    // Save previous frame
    this.prevFrameData.set(data);

    // Ambient Luminance measurement (0-100%)
    const rawAvgLuminance = totalSampled > 0 ? sumLuminance / totalSampled : 128;
    const ambientLuminance = Math.max(0, Math.min(100, Math.round((rawAvgLuminance / 255) * 100)));
    const isLowLight = ambientLuminance <= lowLightThreshold;
    const isPitchDark = ambientLuminance <= pitchDarkThreshold;

    // Calculate normalized motion score (0-100)
    const ratio = totalSampled > 0 ? (changedPixels / totalSampled) * 100 : 0;
    const normalizedScore = Math.min(100, Math.round(ratio * 3.5));

    // Sensitivity threshold check
    const triggerThreshold = sensitivity === 'high' ? 8 : sensitivity === 'medium' ? 15 : 26;
    const hasMotion = normalizedScore >= triggerThreshold;

    // Calculate normalized centroid Y (0.0 top to 1.0 bottom / floor)
    const avgY = changedPixels > 0 ? sumY / changedPixels : this.height * 0.5;
    const centroidY = Math.max(0, Math.min(1, avgY / this.height));
    const isFloorMotion = centroidY >= 0.6;

    return {
      hasMotion,
      score: normalizedScore,
      deltaPixelCount: changedPixels,
      centroidY,
      isFloorMotion,
      ambientLuminance,
      isLowLight,
      isPitchDark,
    };
  }

  public captureSnapshot(videoEl: HTMLVideoElement, quality: number = 0.5): string {
    const snapCanvas = document.createElement('canvas');
    snapCanvas.width = 480;
    snapCanvas.height = 360;
    const ctx = snapCanvas.getContext('2d');
    if (ctx && videoEl.readyState >= 2) {
      ctx.drawImage(videoEl, 0, 0, 480, 360);
      return snapCanvas.toDataURL('image/jpeg', quality);
    }
    return '';
  }

  public reset(): void {
    this.prevFrameData = null;
  }
}
