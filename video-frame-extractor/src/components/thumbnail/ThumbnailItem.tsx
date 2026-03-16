/**
 * Video Frame Extractor - ThumbnailItem Component
 * 单个缩略图项组件，显示帧预览和操作按钮
 */

import { useState, useCallback, memo } from 'react';
import {
  Eye,
  Download,
  Trash2,
  Check,
  Clock,
  FileImage,
  HardDrive,
} from 'lucide-react';
import { Card } from '../ui';
import type { Frame } from '../../types/state';

export interface ThumbnailItemProps {
  /** 帧数据 */
  frame: Frame;
  /** 是否被选中 */
  isSelected: boolean;
  /** 点击选择回调 */
  onSelect: (frameId: string, selected: boolean) => void;
  /** 点击预览回调 */
  onPreview: (frame: Frame) => void;
  /** 点击下载回调 */
  onDownload: (frame: Frame) => void;
  /** 点击删除回调 */
  onDelete: (frameId: string) => void;
}

/**
 * 格式化时间戳为 HH:MM:SS.mmm 格式
 */
function formatTimestamp(seconds: number): string {
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const secs = seconds % 60;

  const pad = (n: number, decimals = 2) => n.toFixed(decimals).padStart(decimals + 1, '0');

  if (hours > 0) {
    return `${hours}:${pad(minutes)}:${pad(secs)}`;
  }
  return `${minutes}:${pad(secs)}`;
}

/**
 * 格式化文件大小
 */
function formatSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
}

/**
 * ThumbnailItem 组件
 * 显示单个帧的缩略图，支持选择、预览、下载和删除操作
 */
export const ThumbnailItem = memo(function ThumbnailItem({
  frame,
  isSelected,
  onSelect,
  onPreview,
  onDownload,
  onDelete,
}: ThumbnailItemProps) {
  const [isHovered, setIsHovered] = useState(false);
  const [imageError, setImageError] = useState(false);

  const handleSelect = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      e.stopPropagation();
      onSelect(frame.id, e.target.checked);
    },
    [frame.id, onSelect]
  );

  const handlePreview = useCallback(
    (e: React.MouseEvent) => {
      e.stopPropagation();
      onPreview(frame);
    },
    [frame, onPreview]
  );

  const handleDownload = useCallback(
    (e: React.MouseEvent) => {
      e.stopPropagation();
      onDownload(frame);
    },
    [frame, onDownload]
  );

  const handleDelete = useCallback(
    (e: React.MouseEvent) => {
      e.stopPropagation();
      onDelete(frame.id);
    },
    [frame.id, onDelete]
  );

  const handleImageError = useCallback(() => {
    setImageError(true);
  }, []);

  return (
    <Card
      variant="default"
      padding="none"
      hoverable
      className={`
        relative overflow-hidden cursor-pointer
        transition-all duration-200
        ${isSelected ? 'ring-2 ring-primary-500 dark:ring-primary-400' : ''}
      `}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      onClick={() => onSelect(frame.id, !isSelected)}
    >
      {/* 缩略图容器 - 4:3 比例 */}
      <div className="relative w-full" style={{ paddingBottom: '75%' }}>
        {/* 图片 */}
        <div className="absolute inset-0 bg-gray-100 dark:bg-gray-800">
          {!imageError ? (
            <img
              src={frame.blobUrl}
              alt={`Frame at ${formatTimestamp(frame.timestamp)}`}
              className="w-full h-full object-cover"
              onError={handleImageError}
              loading="lazy"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center">
              <FileImage className="w-8 h-8 text-gray-400 dark:text-gray-500" />
            </div>
          )}
        </div>

        {/* 选择复选框 */}
        <div
          className={`
            absolute top-2 left-2 z-10
            transition-opacity duration-200
            ${isSelected || isHovered ? 'opacity-100' : 'opacity-0'}
          `}
        >
          <label
            className={`
              flex items-center justify-center
              w-6 h-6 rounded-md
              cursor-pointer
              transition-all duration-200
              ${
                isSelected
                  ? 'bg-primary-500 text-white'
                  : 'bg-white/90 dark:bg-gray-800/90 border border-gray-300 dark:border-gray-600 hover:border-primary-400'
              }
            `}
            onClick={(e) => e.stopPropagation()}
          >
            <input
              type="checkbox"
              checked={isSelected}
              onChange={handleSelect}
              className="sr-only"
            />
            {isSelected && <Check className="w-4 h-4" />}
          </label>
        </div>

        {/* 悬停操作层 */}
        <div
          className={`
            absolute inset-0 z-10
            bg-black/50
            flex items-center justify-center gap-2
            transition-opacity duration-200
            ${isHovered ? 'opacity-100' : 'opacity-0'}
          `}
        >
          <button
            onClick={handlePreview}
            className="p-2 rounded-lg bg-white/90 dark:bg-gray-800/90 text-gray-700 dark:text-gray-200 hover:bg-white dark:hover:bg-gray-700 transition-colors"
            title="预览"
          >
            <Eye className="w-5 h-5" />
          </button>
          <button
            onClick={handleDownload}
            className="p-2 rounded-lg bg-white/90 dark:bg-gray-800/90 text-gray-700 dark:text-gray-200 hover:bg-white dark:hover:bg-gray-700 transition-colors"
            title="下载"
          >
            <Download className="w-5 h-5" />
          </button>
          <button
            onClick={handleDelete}
            className="p-2 rounded-lg bg-white/90 dark:bg-gray-800/90 text-red-500 hover:bg-red-50 dark:hover:bg-red-900/30 transition-colors"
            title="删除"
          >
            <Trash2 className="w-5 h-5" />
          </button>
        </div>

        {/* 帧信息悬浮提示 */}
        <div
          className={`
            absolute bottom-0 left-0 right-0 z-10
            bg-gradient-to-t from-black/70 to-transparent
            p-2 pt-6
            transition-opacity duration-200
            ${isHovered ? 'opacity-100' : 'opacity-0'}
          `}
        >
          <div className="text-white text-xs space-y-0.5">
            <div className="flex items-center gap-1 truncate">
              <FileImage className="w-3 h-3 flex-shrink-0" />
              <span className="truncate">{frame.filename}</span>
            </div>
            <div className="flex items-center gap-1">
              <Clock className="w-3 h-3 flex-shrink-0" />
              <span>{formatTimestamp(frame.timestamp)}</span>
            </div>
            <div className="flex items-center gap-1">
              <HardDrive className="w-3 h-3 flex-shrink-0" />
              <span>{formatSize(frame.size)}</span>
            </div>
          </div>
        </div>
      </div>
    </Card>
  );
});

export default ThumbnailItem;
