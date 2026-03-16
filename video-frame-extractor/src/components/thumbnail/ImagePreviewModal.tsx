/**
 * Video Frame Extractor - ImagePreviewModal Component
 * 图片预览模态框组件，支持全屏预览和导航
 */

import { useEffect, useCallback, useState, memo } from 'react';
import {
  X,
  ChevronLeft,
  ChevronRight,
  Download,
  Clock,
  FileImage,
  HardDrive,
  Maximize2,
} from 'lucide-react';
import type { Frame } from '../../types/state';

export interface ImagePreviewModalProps {
  /** 当前显示的帧 */
  frame: Frame | null;
  /** 所有帧列表，用于导航 */
  frames: Frame[];
  /** 是否显示模态框 */
  isOpen: boolean;
  /** 关闭回调 */
  onClose: () => void;
  /** 下载回调 */
  onDownload: (frame: Frame) => void;
  /** 切换帧回调 */
  onNavigate: (frame: Frame) => void;
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
 * ImagePreviewModal 组件
 * 全屏预览图片，支持键盘导航和下载
 */
export const ImagePreviewModal = memo(function ImagePreviewModal({
  frame,
  frames,
  isOpen,
  onClose,
  onDownload,
  onNavigate,
}: ImagePreviewModalProps) {
  const [imageError, setImageError] = useState(false);
  const [isZoomed, setIsZoomed] = useState(false);

  // 获取当前帧的索引
  const currentIndex = frame ? frames.findIndex((f) => f.id === frame.id) : -1;
  const hasPrev = currentIndex > 0;
  const hasNext = currentIndex < frames.length - 1;

  // 键盘导航
  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      if (!isOpen || !frame) return;

      switch (e.key) {
        case 'Escape':
          onClose();
          break;
        case 'ArrowLeft':
          if (hasPrev) {
            onNavigate(frames[currentIndex - 1]);
          }
          break;
        case 'ArrowRight':
          if (hasNext) {
            onNavigate(frames[currentIndex + 1]);
          }
          break;
      }
    },
    [isOpen, frame, hasPrev, hasNext, currentIndex, frames, onClose, onNavigate]
  );

  // 添加键盘事件监听
  useEffect(() => {
    if (isOpen) {
      document.addEventListener('keydown', handleKeyDown);
      // 禁止背景滚动
      document.body.style.overflow = 'hidden';
    }

    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      document.body.style.overflow = '';
    };
  }, [isOpen, handleKeyDown]);

  // 重置图片错误状态
  useEffect(() => {
    setImageError(false);
    setIsZoomed(false);
  }, [frame?.id]);

  const handlePrev = useCallback(() => {
    if (hasPrev && frame) {
      onNavigate(frames[currentIndex - 1]);
    }
  }, [hasPrev, frame, currentIndex, frames, onNavigate]);

  const handleNext = useCallback(() => {
    if (hasNext && frame) {
      onNavigate(frames[currentIndex + 1]);
    }
  }, [hasNext, frame, currentIndex, frames, onNavigate]);

  const handleDownload = useCallback(() => {
    if (frame) {
      onDownload(frame);
    }
  }, [frame, onDownload]);

  const handleBackdropClick = useCallback(
    (e: React.MouseEvent) => {
      if (e.target === e.currentTarget) {
        onClose();
      }
    },
    [onClose]
  );

  const toggleZoom = useCallback(() => {
    setIsZoomed((prev) => !prev);
  }, []);

  if (!isOpen || !frame) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 backdrop-blur-sm"
      onClick={handleBackdropClick}
    >
      {/* 关闭按钮 */}
      <button
        onClick={onClose}
        className="absolute top-4 right-4 z-20 p-2 rounded-lg bg-white/10 hover:bg-white/20 text-white transition-colors"
        title="关闭 (Esc)"
      >
        <X className="w-6 h-6" />
      </button>

      {/* 导航按钮 - 上一张 */}
      {frames.length > 1 && (
        <button
          onClick={handlePrev}
          disabled={!hasPrev}
          className={`
            absolute left-4 top-1/2 -translate-y-1/2 z-20
            p-3 rounded-full
            transition-all duration-200
            ${
              hasPrev
                ? 'bg-white/10 hover:bg-white/20 text-white cursor-pointer'
                : 'bg-white/5 text-white/30 cursor-not-allowed'
            }
          `}
          title="上一张 (左箭头)"
        >
          <ChevronLeft className="w-8 h-8" />
        </button>
      )}

      {/* 导航按钮 - 下一张 */}
      {frames.length > 1 && (
        <button
          onClick={handleNext}
          disabled={!hasNext}
          className={`
            absolute right-4 top-1/2 -translate-y-1/2 z-20
            p-3 rounded-full
            transition-all duration-200
            ${
              hasNext
                ? 'bg-white/10 hover:bg-white/20 text-white cursor-pointer'
                : 'bg-white/5 text-white/30 cursor-not-allowed'
            }
          `}
          title="下一张 (右箭头)"
        >
          <ChevronRight className="w-8 h-8" />
        </button>
      )}

      {/* 图片容器 */}
      <div
        className={`
          relative max-w-[90vw] max-h-[85vh]
          transition-transform duration-300
          ${isZoomed ? 'cursor-zoom-out' : 'cursor-zoom-in'}
        `}
        onClick={toggleZoom}
      >
        {!imageError ? (
          <img
            src={frame.blobUrl}
            alt={`Frame at ${formatTimestamp(frame.timestamp)}`}
            className={`
              max-w-full max-h-[85vh] object-contain
              transition-transform duration-300
              ${isZoomed ? 'scale-150' : 'scale-100'}
            `}
            onError={() => setImageError(true)}
          />
        ) : (
          <div className="flex flex-col items-center justify-center w-96 h-72 bg-gray-800 rounded-lg">
            <FileImage className="w-16 h-16 text-gray-500 mb-4" />
            <p className="text-gray-400">无法加载图片</p>
          </div>
        )}
      </div>

      {/* 底部工具栏 */}
      <div className="absolute bottom-0 left-0 right-0 z-20 bg-gradient-to-t from-black/80 to-transparent p-4 pt-12">
        <div className="max-w-4xl mx-auto flex items-center justify-between">
          {/* 帧信息 */}
          <div className="text-white space-y-1">
            <div className="flex items-center gap-2">
              <FileImage className="w-4 h-4" />
              <span className="font-medium">{frame.filename}</span>
            </div>
            <div className="flex items-center gap-4 text-sm text-gray-300">
              <div className="flex items-center gap-1">
                <Clock className="w-3.5 h-3.5" />
                <span>{formatTimestamp(frame.timestamp)}</span>
              </div>
              <div className="flex items-center gap-1">
                <HardDrive className="w-3.5 h-3.5" />
                <span>{formatSize(frame.size)}</span>
              </div>
              <div className="flex items-center gap-1">
                <span>{frame.width} x {frame.height}</span>
              </div>
            </div>
          </div>

          {/* 操作按钮 */}
          <div className="flex items-center gap-2">
            <button
              onClick={toggleZoom}
              className="p-2 rounded-lg bg-white/10 hover:bg-white/20 text-white transition-colors"
              title={isZoomed ? '缩小' : '放大'}
            >
              <Maximize2 className="w-5 h-5" />
            </button>
            <button
              onClick={handleDownload}
              className="flex items-center gap-2 px-4 py-2 rounded-lg bg-primary-500 hover:bg-primary-600 text-white transition-colors"
            >
              <Download className="w-5 h-5" />
              <span>下载</span>
            </button>
          </div>
        </div>

        {/* 帧计数器 */}
        {frames.length > 1 && (
          <div className="text-center text-gray-400 text-sm mt-2">
            {currentIndex + 1} / {frames.length}
          </div>
        )}
      </div>
    </div>
  );
});

export default ImagePreviewModal;
