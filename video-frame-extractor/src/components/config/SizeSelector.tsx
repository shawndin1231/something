/**
 * Video Frame Extractor - SizeSelector Component
 * 输出尺寸选择组件
 */

import { useCallback, useMemo } from 'react';
import { Input } from '../ui/Input';

export type SizeMode = 'original' | 'custom-width' | 'custom-height';

export interface SizeSelectorProps {
  /** 当前尺寸模式 */
  mode: SizeMode;
  /** 自定义宽度值 */
  customWidth: number;
  /** 自定义高度值 */
  customHeight: number;
  /** 原始视频宽度 */
  originalWidth: number;
  /** 原始视频高度 */
  originalHeight: number;
  /** 是否禁用 */
  disabled?: boolean;
  /** 模式变化回调 */
  onModeChange: (mode: SizeMode) => void;
  /** 宽度变化回调 */
  onWidthChange: (width: number) => void;
  /** 高度变化回调 */
  onHeightChange: (height: number) => void;
}

/** 尺寸模式选项 */
const SIZE_MODE_OPTIONS: { value: SizeMode; label: string; description: string }[] = [
  {
    value: 'original',
    label: '保持原始',
    description: '使用视频原始尺寸',
  },
  {
    value: 'custom-width',
    label: '自定义宽度',
    description: '按比例缩放到指定宽度',
  },
  {
    value: 'custom-height',
    label: '自定义高度',
    description: '按比例缩放到指定高度',
  },
];

/**
 * 尺寸选择组件
 * 支持保持原始尺寸、自定义宽度、自定义高度三种模式
 * 自动保持宽高比
 */
export function SizeSelector({
  mode,
  customWidth,
  customHeight,
  originalWidth,
  originalHeight,
  disabled = false,
  onModeChange,
  onWidthChange,
  onHeightChange,
}: SizeSelectorProps) {
  // 宽高比
  const aspectRatio = useMemo(
    () => originalWidth / originalHeight,
    [originalWidth, originalHeight]
  );

  // 根据宽度计算高度
  const calculatedHeight = useMemo(() => {
    if (mode === 'custom-width' && customWidth > 0) {
      return Math.round(customWidth / aspectRatio);
    }
    return originalHeight;
  }, [mode, customWidth, aspectRatio, originalHeight]);

  // 根据高度计算宽度
  const calculatedWidth = useMemo(() => {
    if (mode === 'custom-height' && customHeight > 0) {
      return Math.round(customHeight * aspectRatio);
    }
    return originalWidth;
  }, [mode, customHeight, aspectRatio, originalWidth]);

  // 处理宽度输入
  const handleWidthChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const value = parseInt(e.target.value, 10);
      if (!isNaN(value) && value > 0) {
        onWidthChange(value);
      }
    },
    [onWidthChange]
  );

  // 处理高度输入
  const handleHeightChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const value = parseInt(e.target.value, 10);
      if (!isNaN(value) && value > 0) {
        onHeightChange(value);
      }
    },
    [onHeightChange]
  );

  // 格式化尺寸显示
  const formatSize = (w: number, h: number) => `${w} x ${h}`;

  return (
    <div className="space-y-4">
      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
        输出尺寸
      </label>

      {/* 模式选择按钮组 */}
      <div className="grid grid-cols-3 gap-2">
        {SIZE_MODE_OPTIONS.map((option) => (
          <button
            key={option.value}
            type="button"
            onClick={() => onModeChange(option.value)}
            disabled={disabled}
            className={`
              p-3 rounded-lg border-2 text-left
              transition-all duration-200 ease-in-out
              focus:outline-none focus:ring-2 focus:ring-primary-500/20
              disabled:cursor-not-allowed disabled:opacity-50
              ${
                mode === option.value
                  ? 'border-primary-500 bg-primary-50 dark:bg-primary-900/20'
                  : 'border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600'
              }
            `.replace(/\s+/g, ' ').trim()}
          >
            <div className="text-sm font-medium text-gray-900 dark:text-gray-100">
              {option.label}
            </div>
          </button>
        ))}
      </div>

      {/* 原始尺寸显示 */}
      {mode === 'original' && (
        <div className="p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
          <div className="flex items-center justify-between">
            <span className="text-sm text-gray-500 dark:text-gray-400">
              原始尺寸
            </span>
            <span className="text-sm font-medium text-gray-900 dark:text-gray-100">
              {formatSize(originalWidth, originalHeight)}
            </span>
          </div>
        </div>
      )}

      {/* 自定义宽度输入 */}
      {mode === 'custom-width' && (
        <div className="space-y-3">
          <div className="flex items-end gap-2">
            <div className="flex-1">
              <Input
                type="number"
                label="宽度"
                value={customWidth || ''}
                onChange={handleWidthChange}
                disabled={disabled}
                min={1}
                max={originalWidth}
                fullWidth
              />
            </div>
            <span className="pb-2.5 text-gray-500 dark:text-gray-400">px</span>
          </div>

          {/* 计算后的尺寸预览 */}
          <div className="p-3 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg">
            <div className="flex items-center gap-2">
              <svg
                className="w-4 h-4 text-blue-500"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M4 8V4m0 0h4M4 4l5 5m11-1V4m0 0h-4m4 0l-5 5M4 16v4m0 0h4m-4 0l5-5m11 5l-5-5m5 5v-4m0 4h-4"
                />
              </svg>
              <span className="text-sm text-blue-600 dark:text-blue-400">
                输出尺寸: {formatSize(customWidth || originalWidth, calculatedHeight)} px
              </span>
            </div>
            <p className="text-xs text-blue-500 dark:text-blue-500 mt-1 ml-6">
              高度将自动按比例调整为 {calculatedHeight}px
            </p>
          </div>
        </div>
      )}

      {/* 自定义高度输入 */}
      {mode === 'custom-height' && (
        <div className="space-y-3">
          <div className="flex items-end gap-2">
            <div className="flex-1">
              <Input
                type="number"
                label="高度"
                value={customHeight || ''}
                onChange={handleHeightChange}
                disabled={disabled}
                min={1}
                max={originalHeight}
                fullWidth
              />
            </div>
            <span className="pb-2.5 text-gray-500 dark:text-gray-400">px</span>
          </div>

          {/* 计算后的尺寸预览 */}
          <div className="p-3 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg">
            <div className="flex items-center gap-2">
              <svg
                className="w-4 h-4 text-blue-500"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M4 8V4m0 0h4M4 4l5 5m11-1V4m0 0h-4m4 0l-5 5M4 16v4m0 0h4m-4 0l5-5m11 5l-5-5m5 5v-4m0 4h-4"
                />
              </svg>
              <span className="text-sm text-blue-600 dark:text-blue-400">
                输出尺寸: {formatSize(calculatedWidth, customHeight || originalHeight)} px
              </span>
            </div>
            <p className="text-xs text-blue-500 dark:text-blue-500 mt-1 ml-6">
              宽度将自动按比例调整为 {calculatedWidth}px
            </p>
          </div>
        </div>
      )}

      {/* 宽高比信息 */}
      <div className="text-xs text-gray-400 dark:text-gray-500">
        原始宽高比: {aspectRatio.toFixed(2)}:1 ({originalWidth}x{originalHeight})
      </div>
    </div>
  );
}

export default SizeSelector;
