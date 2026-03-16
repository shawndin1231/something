/**
 * Video Frame Extractor - IntervalInput Component
 * 时间间隔输入组件
 */

import { useCallback, useMemo } from 'react';
import { Input } from '../ui/Input';

export interface IntervalInputProps {
  /** 当前间隔值（秒） */
  value: number;
  /** 视频时长（秒） */
  maxDuration: number;
  /** 是否禁用 */
  disabled?: boolean;
  /** 值变化回调 */
  onChange: (value: number) => void;
}

/**
 * 时间间隔输入组件
 * 支持验证最小值 0.1s 和最大视频时长
 * 实时显示预估帧数，超过 500 帧时显示警告
 */
export function IntervalInput({
  value,
  maxDuration,
  disabled = false,
  onChange,
}: IntervalInputProps) {
  // 计算预估帧数
  const estimatedFrames = useMemo(() => {
    if (value <= 0 || maxDuration <= 0) return 0;
    return Math.floor(maxDuration / value);
  }, [value, maxDuration]);

  // 是否超过警告阈值
  const isOverThreshold = estimatedFrames > 500;

  // 验证错误信息
  const errorMessage = useMemo(() => {
    if (value < 0.1) return '最小间隔为 0.1 秒';
    if (value > maxDuration) return `最大间隔为 ${maxDuration.toFixed(1)} 秒`;
    return undefined;
  }, [value, maxDuration]);

  // 处理输入变化
  const handleChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const newValue = parseFloat(e.target.value);
      if (!isNaN(newValue) && newValue >= 0) {
        onChange(newValue);
      }
    },
    [onChange]
  );

  // 格式化帧数显示
  const formatFrameCount = (count: number): string => {
    if (count >= 1000) {
      return `${(count / 1000).toFixed(1)}k`;
    }
    return count.toString();
  };

  return (
    <div className="space-y-2">
      <div className="flex items-center gap-2">
        <div className="flex-1">
          <Input
            type="number"
            label="提取间隔"
            value={value || ''}
            onChange={handleChange}
            disabled={disabled}
            min={0.1}
            max={maxDuration}
            step={0.1}
            error={errorMessage}
            hint={`预估提取 ${formatFrameCount(estimatedFrames)} 帧`}
            fullWidth
          />
        </div>
        <div className="flex items-center pt-6">
          <span className="text-gray-500 dark:text-gray-400 text-base">秒</span>
        </div>
      </div>

      {/* 帧数警告 */}
      {isOverThreshold && (
        <div className="flex items-start gap-2 p-3 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-lg">
          <svg
            className="w-5 h-5 text-amber-500 flex-shrink-0 mt-0.5"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
            />
          </svg>
          <div className="flex-1">
            <p className="text-sm text-amber-700 dark:text-amber-300 font-medium">
              帧数较多
            </p>
            <p className="text-xs text-amber-600 dark:text-amber-400 mt-0.5">
              预估将提取 {estimatedFrames} 帧，处理时间可能较长，建议增大间隔
            </p>
          </div>
        </div>
      )}
    </div>
  );
}

export default IntervalInput;
