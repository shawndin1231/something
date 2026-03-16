/**
 * Video Frame Extractor - QualitySlider Component
 * 图片质量滑块组件
 */

import { useCallback, useMemo } from 'react';

export interface QualitySliderProps {
  /** 当前质量值 (1-100) */
  value: number;
  /** 当前图片格式 */
  format: 'jpeg' | 'png' | 'webp';
  /** 是否禁用 */
  disabled?: boolean;
  /** 值变化回调 */
  onChange: (value: number) => void;
}

/**
 * 质量滑块组件
 * 范围 1-100，PNG 格式时禁用（无损）
 */
export function QualitySlider({
  value,
  format,
  disabled = false,
  onChange,
}: QualitySliderProps) {
  // PNG 格式是无损的，不需要质量设置
  const isDisabled = disabled || format === 'png';

  // 质量等级描述
  const qualityLabel = useMemo(() => {
    if (format === 'png') return '无损';
    if (value >= 90) return '高质量';
    if (value >= 70) return '标准';
    if (value >= 50) return '中等';
    return '低质量';
  }, [value, format]);

  // 质量等级颜色
  const qualityColor = useMemo(() => {
    if (format === 'png') return 'text-green-500';
    if (value >= 90) return 'text-green-500';
    if (value >= 70) return 'text-blue-500';
    if (value >= 50) return 'text-amber-500';
    return 'text-red-500';
  }, [value, format]);

  // 滑块轨道颜色
  const trackColor = useMemo(() => {
    if (format === 'png') return 'bg-green-500';
    if (value >= 90) return 'bg-green-500';
    if (value >= 70) return 'bg-blue-500';
    if (value >= 50) return 'bg-amber-500';
    return 'bg-red-500';
  }, [value, format]);

  // 处理滑块变化
  const handleChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const newValue = parseInt(e.target.value, 10);
      if (!isNaN(newValue) && newValue >= 1 && newValue <= 100) {
        onChange(newValue);
      }
    },
    [onChange]
  );

  // 计算滑块填充百分比
  const fillPercent = ((value - 1) / 99) * 100;

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
          图片质量
        </label>
        <div className="flex items-center gap-2">
          <span className={`text-sm font-medium ${qualityColor}`}>
            {qualityLabel}
          </span>
          {format !== 'png' && (
            <span className="text-sm text-gray-500 dark:text-gray-400">
              ({value}%)
            </span>
          )}
        </div>
      </div>

      {/* PNG 格式提示 */}
      {format === 'png' && (
        <div className="flex items-center gap-2 p-2 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg">
          <svg
            className="w-4 h-4 text-green-500"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
            />
          </svg>
          <span className="text-xs text-green-600 dark:text-green-400">
            PNG 格式为无损压缩，无需设置质量
          </span>
        </div>
      )}

      {/* 滑块容器 */}
      <div className={`relative ${isDisabled ? 'opacity-50' : ''}`}>
        <div className="relative h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
          {/* 填充轨道 */}
          <div
            className={`absolute h-full ${trackColor} transition-all duration-150`}
            style={{ width: `${fillPercent}%` }}
          />
        </div>

        {/* 滑块输入 */}
        <input
          type="range"
          min={1}
          max={100}
          value={format === 'png' ? 100 : value}
          onChange={handleChange}
          disabled={isDisabled}
          className={`
            absolute inset-0 w-full h-2
            appearance-none bg-transparent
            cursor-pointer
            disabled:cursor-not-allowed
            [&::-webkit-slider-thumb]:appearance-none
            [&::-webkit-slider-thumb]:w-4
            [&::-webkit-slider-thumb]:h-4
            [&::-webkit-slider-thumb]:rounded-full
            [&::-webkit-slider-thumb]:bg-white
            [&::-webkit-slider-thumb]:border-2
            [&::-webkit-slider-thumb]:border-primary-500
            [&::-webkit-slider-thumb]:shadow-md
            [&::-webkit-slider-thumb]:cursor-pointer
            [&::-webkit-slider-thumb]:transition-transform
            [&::-webkit-slider-thumb]:hover:scale-110
            [&::-moz-range-thumb]:w-4
            [&::-moz-range-thumb]:h-4
            [&::-moz-range-thumb]:rounded-full
            [&::-moz-range-thumb]:bg-white
            [&::-moz-range-thumb]:border-2
            [&::-moz-range-thumb]:border-primary-500
            [&::-moz-range-thumb]:shadow-md
            [&::-moz-range-thumb]:cursor-pointer
          `.replace(/\s+/g, ' ').trim()}
        />
      </div>

      {/* 刻度标签 */}
      {format !== 'png' && (
        <div className="flex justify-between text-xs text-gray-400 dark:text-gray-500">
          <span>低</span>
          <span>中</span>
          <span>高</span>
        </div>
      )}

      {/* 快捷预设按钮 */}
      {format !== 'png' && !disabled && (
        <div className="flex gap-2">
          {[50, 75, 90, 100].map((preset) => (
            <button
              key={preset}
              type="button"
              onClick={() => onChange(preset)}
              className={`
                flex-1 py-1.5 text-xs font-medium rounded-md
                transition-all duration-200
                ${
                  value === preset
                    ? 'bg-primary-500 text-white'
                    : 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700'
                }
              `.replace(/\s+/g, ' ').trim()}
            >
              {preset}%
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

export default QualitySlider;
