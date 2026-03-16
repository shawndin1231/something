/**
 * Video Frame Extractor - TimeRangeSelector Component
 * 时间范围选择组件
 */

import { useCallback, useMemo } from 'react';
import { Input } from '../ui/Input';

export type TimeRangeMode = 'full' | 'custom';

export interface TimeRangeSelectorProps {
  /** 当前时间范围模式 */
  mode: TimeRangeMode;
  /** 开始时间（秒） */
  startTime: number;
  /** 结束时间（秒） */
  endTime: number;
  /** 视频总时长（秒） */
  duration: number;
  /** 是否禁用 */
  disabled?: boolean;
  /** 模式变化回调 */
  onModeChange: (mode: TimeRangeMode) => void;
  /** 开始时间变化回调 */
  onStartTimeChange: (time: number) => void;
  /** 结束时间变化回调 */
  onEndTimeChange: (time: number) => void;
}

/**
 * 将秒数格式化为 HH:MM:SS 或 MM:SS
 */
function formatTime(seconds: number): string {
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const secs = Math.floor(seconds % 60);

  if (hours > 0) {
    return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  }
  return `${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
}

/**
 * 时间范围选择组件
 * 支持完整视频或自定义时间范围
 */
export function TimeRangeSelector({
  mode,
  startTime,
  endTime,
  duration,
  disabled = false,
  onModeChange,
  onStartTimeChange,
  onEndTimeChange,
}: TimeRangeSelectorProps) {
  // 验证错误
  const validationError = useMemo(() => {
    if (mode !== 'custom') return undefined;
    if (startTime < 0) return '开始时间不能小于 0';
    if (endTime > duration) return `结束时间不能超过 ${formatTime(duration)}`;
    if (startTime >= endTime) return '开始时间必须小于结束时间';
    return undefined;
  }, [mode, startTime, endTime, duration]);

  // 时间范围时长
  const rangeDuration = useMemo(() => {
    if (mode === 'full') return duration;
    return Math.max(0, endTime - startTime);
  }, [mode, startTime, endTime, duration]);

  // 处理秒数输入
  const handleStartSecondsChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const value = parseFloat(e.target.value);
      if (!isNaN(value)) {
        onStartTimeChange(Math.max(0, Math.min(value, duration)));
      }
    },
    [duration, onStartTimeChange]
  );

  const handleEndSecondsChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const value = parseFloat(e.target.value);
      if (!isNaN(value)) {
        onEndTimeChange(Math.max(0, Math.min(value, duration)));
      }
    },
    [duration, onEndTimeChange]
  );

  return (
    <div className="space-y-4">
      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
        提取范围
      </label>

      {/* 模式选择按钮组 */}
      <div className="grid grid-cols-2 gap-2">
        <button
          type="button"
          onClick={() => onModeChange('full')}
          disabled={disabled}
          className={`
            p-3 rounded-lg border-2 text-left
            transition-all duration-200 ease-in-out
            focus:outline-none focus:ring-2 focus:ring-primary-500/20
            disabled:cursor-not-allowed disabled:opacity-50
            ${
              mode === 'full'
                ? 'border-primary-500 bg-primary-50 dark:bg-primary-900/20'
                : 'border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600'
            }
          `.replace(/\s+/g, ' ').trim()}
        >
          <div className="text-sm font-medium text-gray-900 dark:text-gray-100">
            完整视频
          </div>
          <div className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
            {formatTime(duration)}
          </div>
        </button>

        <button
          type="button"
          onClick={() => onModeChange('custom')}
          disabled={disabled}
          className={`
            p-3 rounded-lg border-2 text-left
            transition-all duration-200 ease-in-out
            focus:outline-none focus:ring-2 focus:ring-primary-500/20
            disabled:cursor-not-allowed disabled:opacity-50
            ${
              mode === 'custom'
                ? 'border-primary-500 bg-primary-50 dark:bg-primary-900/20'
                : 'border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600'
            }
          `.replace(/\s+/g, ' ').trim()}
        >
          <div className="text-sm font-medium text-gray-900 dark:text-gray-100">
            自定义范围
          </div>
          <div className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
            选择时间段
          </div>
        </button>
      </div>

      {/* 自定义时间范围输入 */}
      {mode === 'custom' && (
        <div className="space-y-4">
          {/* 时间范围可视化 */}
          <div className="relative h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
            <div
              className="absolute h-full bg-primary-500"
              style={{
                left: `${(startTime / duration) * 100}%`,
                width: `${((endTime - startTime) / duration) * 100}%`,
              }}
            />
          </div>

          {/* 开始时间 */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Input
                type="number"
                label="开始时间"
                value={startTime.toFixed(1)}
                onChange={handleStartSecondsChange}
                disabled={disabled}
                min={0}
                max={endTime}
                step={0.1}
                hint={formatTime(startTime)}
                fullWidth
              />
            </div>
            <div>
              <Input
                type="number"
                label="结束时间"
                value={endTime.toFixed(1)}
                onChange={handleEndSecondsChange}
                disabled={disabled}
                min={startTime}
                max={duration}
                step={0.1}
                hint={formatTime(endTime)}
                fullWidth
              />
            </div>
          </div>

          {/* 验证错误 */}
          {validationError && (
            <div className="flex items-center gap-2 p-2 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
              <svg
                className="w-4 h-4 text-red-500"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
              <span className="text-sm text-red-600 dark:text-red-400">
                {validationError}
              </span>
            </div>
          )}

          {/* 时间范围信息 */}
          {!validationError && (
            <div className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
              <span className="text-sm text-gray-500 dark:text-gray-400">
                提取时长
              </span>
              <span className="text-sm font-medium text-gray-900 dark:text-gray-100">
                {formatTime(rangeDuration)} ({rangeDuration.toFixed(1)}秒)
              </span>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default TimeRangeSelector;
