/**
 * Video Frame Extractor - FormatSelect Component
 * 输出格式选择组件
 */

import { useCallback, useMemo } from 'react';

export type ImageFormat = 'jpeg' | 'png' | 'webp';

export interface FormatOption {
  value: ImageFormat;
  label: string;
  description: string;
  extension: string;
}

/** 可用的图片格式选项 */
const FORMAT_OPTIONS: FormatOption[] = [
  {
    value: 'jpeg',
    label: 'JPG',
    description: '文件较小，适合照片类视频',
    extension: '.jpg',
  },
  {
    value: 'png',
    description: '无损压缩，适合截图和动画',
    extension: '.png',
    label: 'PNG',
  },
  {
    value: 'webp',
    label: 'WebP',
    description: '现代格式，体积小质量高',
    extension: '.webp',
  },
];

export interface FormatSelectProps {
  /** 当前选中的格式 */
  value: ImageFormat;
  /** 是否禁用 */
  disabled?: boolean;
  /** 值变化回调 */
  onChange: (value: ImageFormat) => void;
}

/**
 * 格式选择组件
 * 提供 JPG、PNG、WebP 三种格式选择
 * 每个选项显示格式描述
 */
export function FormatSelect({
  value,
  disabled = false,
  onChange,
}: FormatSelectProps) {
  // 当前选中的格式信息
  const selectedFormat = useMemo(
    () => FORMAT_OPTIONS.find((opt) => opt.value === value),
    [value]
  );

  // 处理选择变化
  const handleChange = useCallback(
    (e: React.ChangeEvent<HTMLSelectElement>) => {
      onChange(e.target.value as ImageFormat);
    },
    [onChange]
  );

  return (
    <div className="space-y-2">
      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
        输出格式
      </label>
      
      <div className="relative">
        <select
          value={value}
          onChange={handleChange}
          disabled={disabled}
          className={`
            w-full px-4 py-2.5
            bg-white dark:bg-gray-900
            border border-gray-300 dark:border-gray-600
            rounded-lg
            text-gray-900 dark:text-gray-100
            text-base
            appearance-none
            cursor-pointer
            transition-all duration-200 ease-in-out
            hover:border-gray-400 dark:hover:border-gray-500
            focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500
            disabled:bg-gray-100 disabled:dark:bg-gray-800
            disabled:cursor-not-allowed disabled:text-gray-500
          `.replace(/\s+/g, ' ').trim()}
        >
          {FORMAT_OPTIONS.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>

        {/* 下拉箭头图标 */}
        <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-gray-400">
          <svg
            className="w-5 h-5"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M19 9l-7 7-7-7"
            />
          </svg>
        </div>
      </div>

      {/* 当前格式描述 */}
      {selectedFormat && (
        <p className="text-sm text-gray-500 dark:text-gray-400">
          {selectedFormat.description}
        </p>
      )}

      {/* 格式选项卡片 */}
      <div className="grid grid-cols-3 gap-2 mt-3">
        {FORMAT_OPTIONS.map((option) => (
          <button
            key={option.value}
            type="button"
            onClick={() => onChange(option.value)}
            disabled={disabled}
            className={`
              p-3 rounded-lg border-2 text-left
              transition-all duration-200 ease-in-out
              focus:outline-none focus:ring-2 focus:ring-primary-500/20
              disabled:cursor-not-allowed
              ${
                value === option.value
                  ? 'border-primary-500 bg-primary-50 dark:bg-primary-900/20'
                  : 'border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600'
              }
              ${disabled ? 'opacity-50' : ''}
            `.replace(/\s+/g, ' ').trim()}
          >
            <div className="text-sm font-medium text-gray-900 dark:text-gray-100">
              {option.label}
            </div>
            <div className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
              {option.extension}
            </div>
          </button>
        ))}
      </div>
    </div>
  );
}

export default FormatSelect;
