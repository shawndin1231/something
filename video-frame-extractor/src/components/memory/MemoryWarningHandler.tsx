import { useCallback } from 'react';
import { useMemoryMonitor } from '../../hooks/useMemoryMonitor';
import { useToast } from '../toast/useToast';
import { formatBytes } from '../../utils/memoryMonitor';

export function MemoryWarningHandler() {
  const toast = useToast();

  const handleWarning = useCallback(
    (info: { usagePercentage: number }) => {
      toast.warning('内存使用较高', {
        description: `当前内存使用 ${info.usagePercentage.toFixed(1)}%，建议减少帧数或降低质量`,
        duration: 5000,
      });
    },
    [toast]
  );

  const handleCritical = useCallback(
    (info: { usagePercentage: number }) => {
      toast.error('内存使用过高', {
        description: `内存使用已达 ${info.usagePercentage.toFixed(1)}%，正在自动降低处理质量`,
        duration: 8000,
      });
    },
    [toast]
  );

  const handleEmergency = useCallback(
    (info: { usagePercentage: number; usedJSHeapSize: number }) => {
      toast.error('内存即将耗尽', {
        description: `内存使用 ${info.usagePercentage.toFixed(1)}% (${formatBytes(info.usedJSHeapSize)})，请立即保存并刷新页面`,
        duration: 0,
      });
    },
    [toast]
  );

  useMemoryMonitor({
    intervalMs: 3000,
    onWarning: handleWarning,
    onCritical: handleCritical,
    onEmergency: handleEmergency,
  });

  return null;
}
