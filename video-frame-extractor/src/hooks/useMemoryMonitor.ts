import { useState, useEffect, useCallback, useRef } from 'react';
import {
  getMemoryInfo,
  getMemoryStatus,
  DEFAULT_THRESHOLDS,
} from '../utils/memoryMonitor';
import type { MemoryInfo, MemoryThresholds } from '../utils/memoryMonitor';

export interface UseMemoryMonitorOptions {
  thresholds?: MemoryThresholds;
  intervalMs?: number;
  onWarning?: (info: MemoryInfo) => void;
  onCritical?: (info: MemoryInfo) => void;
  onEmergency?: (info: MemoryInfo) => void;
}

export interface UseMemoryMonitorReturn {
  memoryInfo: MemoryInfo | null;
  status: 'normal' | 'warning' | 'critical' | 'emergency';
  isSupported: boolean;
  forceGC: () => void;
}

export function useMemoryMonitor(options: UseMemoryMonitorOptions = {}): UseMemoryMonitorReturn {
  const {
    thresholds = DEFAULT_THRESHOLDS,
    intervalMs = 5000,
    onWarning,
    onCritical,
    onEmergency,
  } = options;

  const [memoryInfo, setMemoryInfo] = useState<MemoryInfo | null>(null);
  const [status, setStatus] = useState<'normal' | 'warning' | 'critical' | 'emergency'>('normal');
  const previousStatusRef = useRef<string>('normal');
  const isSupported = typeof window !== 'undefined' && !!(window.performance as any).memory;

  const checkMemory = useCallback(() => {
    const info = getMemoryInfo();
    const currentStatus = getMemoryStatus(thresholds);

    setMemoryInfo(info);
    setStatus(currentStatus);

    if (currentStatus !== previousStatusRef.current) {
      previousStatusRef.current = currentStatus;

      if (info) {
        switch (currentStatus) {
          case 'warning':
            onWarning?.(info);
            break;
          case 'critical':
            onCritical?.(info);
            break;
          case 'emergency':
            onEmergency?.(info);
            break;
        }
      }
    }
  }, [thresholds, onWarning, onCritical, onEmergency]);

  useEffect(() => {
    if (!isSupported) return;

    checkMemory();

    const intervalId = setInterval(checkMemory, intervalMs);

    return () => {
      clearInterval(intervalId);
    };
  }, [isSupported, intervalMs, checkMemory]);

  const forceGC = useCallback(() => {
    if (typeof (window as any).gc === 'function') {
      (window as any).gc();
    }
  }, []);

  return {
    memoryInfo,
    status,
    isSupported,
    forceGC,
  };
}
