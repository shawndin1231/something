export interface MemoryInfo {
  usedJSHeapSize: number;
  totalJSHeapSize: number;
  jsHeapSizeLimit: number;
  usagePercentage: number;
}

export interface MemoryThresholds {
  warning: number;
  critical: number;
  emergency: number;
}

export const DEFAULT_THRESHOLDS: MemoryThresholds = {
  warning: 70,
  critical: 85,
  emergency: 95,
};

export function getMemoryInfo(): MemoryInfo | null {
  const performance = window.performance as Performance & {
    memory?: {
      usedJSHeapSize: number;
      totalJSHeapSize: number;
      jsHeapSizeLimit: number;
    };
  };

  if (!performance?.memory) {
    return null;
  }

  const { usedJSHeapSize, totalJSHeapSize, jsHeapSizeLimit } = performance.memory;
  const usagePercentage = (usedJSHeapSize / jsHeapSizeLimit) * 100;

  return {
    usedJSHeapSize,
    totalJSHeapSize,
    jsHeapSizeLimit,
    usagePercentage,
  };
}

export function getMemoryStatus(
  thresholds: MemoryThresholds = DEFAULT_THRESHOLDS
): 'normal' | 'warning' | 'critical' | 'emergency' {
  const memoryInfo = getMemoryInfo();

  if (!memoryInfo) {
    return 'normal';
  }

  const { usagePercentage } = memoryInfo;

  if (usagePercentage >= thresholds.emergency) {
    return 'emergency';
  }

  if (usagePercentage >= thresholds.critical) {
    return 'critical';
  }

  if (usagePercentage >= thresholds.warning) {
    return 'warning';
  }

  return 'normal';
}

export function formatBytes(bytes: number): string {
  if (bytes === 0) return '0 B';

  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));

  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(2))} ${sizes[i]}`;
}

export function shouldReduceQuality(
  currentQuality: number,
  thresholds: MemoryThresholds = DEFAULT_THRESHOLDS
): { shouldReduce: boolean; newQuality: number } {
  const status = getMemoryStatus(thresholds);

  if (status === 'normal' || status === 'warning') {
    return { shouldReduce: false, newQuality: currentQuality };
  }

  if (status === 'emergency') {
    const newQuality = Math.max(1, currentQuality - 3);
    return { shouldReduce: true, newQuality };
  }

  if (status === 'critical') {
    const newQuality = Math.max(1, currentQuality - 2);
    return { shouldReduce: true, newQuality };
  }

  return { shouldReduce: false, newQuality: currentQuality };
}

export function estimateMemoryForFrames(
  frameCount: number,
  width: number,
  height: number,
  quality: number
): number {
  const baseSize = width * height * 4;

  const qualityMultiplier = 1 + (10 - quality) * 0.1;

  const estimatedSize = baseSize * frameCount * qualityMultiplier;

  return estimatedSize;
}

export function canSafelyProcessFrames(
  frameCount: number,
  width: number,
  height: number,
  quality: number,
  safetyMargin: number = 0.3
): { canProcess: boolean; estimatedMemory: number; availableMemory: number } {
  const memoryInfo = getMemoryInfo();

  if (!memoryInfo) {
    return { canProcess: true, estimatedMemory: 0, availableMemory: Infinity };
  }

  const estimatedMemory = estimateMemoryForFrames(frameCount, width, height, quality);
  const availableMemory = memoryInfo.jsHeapSizeLimit - memoryInfo.usedJSHeapSize;
  const safeAvailableMemory = availableMemory * (1 - safetyMargin);

  return {
    canProcess: estimatedMemory < safeAvailableMemory,
    estimatedMemory,
    availableMemory,
  };
}
