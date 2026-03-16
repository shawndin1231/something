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

  const thresholdsRef = useRef(thresholds);
  const onWarningRef = useRef(onWarning);
  const onCriticalRef = useRef(onCritical);
  const onEmergencyRef = useRef(onEmergency);

  useEffect(() => {
    thresholdsRef.current = thresholds;
    onWarningRef.current = onWarning;
    onCriticalRef.current = onCritical;
    onEmergencyRef.current = onEmergency;
  });

  useEffect(() => {
    if (!isSupported) return;

    const checkMemory = () => {
      const info = getMemoryInfo();
      const currentStatus = getMemoryStatus(thresholdsRef.current);

      setMemoryInfo((prev) => {
        if (
          prev &&
          info &&
          prev.usedJSHeapSize === info.usedJSHeapSize &&
          prev.totalJSHeapSize === info.totalJSHeapSize
        ) {
          return prev;
        }
        return info;
      });

      setStatus((prev) => {
        if (prev === currentStatus) {
          return prev;
        }

        if (currentStatus !== previousStatusRef.current) {
          previousStatusRef.current = currentStatus;

          if (info) {
            switch (currentStatus) {
              case 'warning':
                onWarningRef.current?.(info);
                break;
              case 'critical':
                onCriticalRef.current?.(info);
                break;
              case 'emergency':
                onEmergencyRef.current?.(info);
                break;
            }
          }
        }

        return currentStatus;
      });
    };

    checkMemory();

    const intervalId = setInterval(checkMemory, intervalMs);

    return () => {
      clearInterval(intervalId);
    };
  }, [isSupported, intervalMs]);

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
