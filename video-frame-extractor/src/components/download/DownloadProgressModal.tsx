/**
 * Video Frame Extractor - Download Progress Modal
 * 下载进度模态框组件
 */

import { useEffect, useCallback, memo } from 'react';
import { X, Download, CheckCircle, XCircle, Loader2 } from 'lucide-react';
import { Button, ProgressBar } from '../ui';
import type { DownloadProgress } from '../../services/downloadService';
import { formatFileSize, calculateTotalSize } from '../../utils/download';
import type { Frame } from '../../types/state';

export interface DownloadProgressModalProps {
  /** 是否显示 */
  isOpen: boolean;
  /** 关闭回调 */
  onClose: () => void;
  /** 取消下载回调 */
  onCancel: () => void;
  /** 下载进度 */
  progress: DownloadProgress;
  /** 正在下载的帧 */
  frames: Frame[];
  /** ZIP 文件名 */
  zipName: string;
}

/**
 * 获取状态图标
 */
function StatusIcon({ status }: { status: DownloadProgress['status'] }) {
  switch (status) {
    case 'preparing':
    case 'downloading':
      return <Loader2 className="w-5 h-5 text-primary-500 animate-spin" />;
    case 'completed':
      return <CheckCircle className="w-5 h-5 text-green-500" />;
    case 'cancelled':
      return <XCircle className="w-5 h-5 text-yellow-500" />;
    case 'error':
      return <XCircle className="w-5 h-5 text-red-500" />;
    default:
      return <Download className="w-5 h-5 text-gray-400" />;
  }
}

/**
 * 获取状态文本
 */
function getStatusText(status: DownloadProgress['status']): string {
  switch (status) {
    case 'preparing':
      return '准备中...';
    case 'downloading':
      return '正在打包...';
    case 'completed':
      return '下载完成';
    case 'cancelled':
      return '已取消';
    case 'error':
      return '下载失败';
    default:
      return '准备下载';
  }
}

/**
 * DownloadProgressModal 组件
 * 显示 ZIP 下载进度，支持取消操作
 */
export const DownloadProgressModal = memo(function DownloadProgressModal({
  isOpen,
  onClose,
  onCancel,
  progress,
  frames,
  zipName,
}: DownloadProgressModalProps) {
  const isDownloading = progress.status === 'preparing' || progress.status === 'downloading';
  const isCompleted = progress.status === 'completed';
  const isCancelled = progress.status === 'cancelled';
  const hasError = progress.status === 'error';

  // 计算总大小
  const totalSize = calculateTotalSize(frames);

  // ESC 键关闭
  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        if (isDownloading) {
          onCancel();
        } else {
          onClose();
        }
      }
    },
    [isDownloading, onCancel, onClose]
  );

  useEffect(() => {
    if (isOpen) {
      window.addEventListener('keydown', handleKeyDown);
      return () => window.removeEventListener('keydown', handleKeyDown);
    }
  }, [isOpen, handleKeyDown]);

  // 自动关闭（成功或取消后）
  useEffect(() => {
    if (isCompleted || isCancelled) {
      const timer = setTimeout(() => {
        onClose();
      }, 2000);
      return () => clearTimeout(timer);
    }
  }, [isCompleted, isCancelled, onClose]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* 背景遮罩 */}
      <div
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        onClick={isDownloading ? undefined : onClose}
      />

      {/* 模态框内容 */}
      <div
        className="
          relative z-10
          w-full max-w-md mx-4
          bg-white dark:bg-gray-800
          rounded-xl shadow-2xl
          overflow-hidden
        "
        role="dialog"
        aria-modal="true"
        aria-labelledby="download-modal-title"
      >
        {/* 头部 */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200 dark:border-gray-700">
          <div className="flex items-center gap-3">
            <StatusIcon status={progress.status} />
            <h2
              id="download-modal-title"
              className="text-lg font-semibold text-gray-900 dark:text-gray-100"
            >
              {getStatusText(progress.status)}
            </h2>
          </div>
          {!isDownloading && (
            <button
              onClick={onClose}
              className="p-1 rounded-lg text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
              aria-label="关闭"
            >
              <X className="w-5 h-5" />
            </button>
          )}
        </div>

        {/* 内容 */}
        <div className="px-6 py-4 space-y-4">
          {/* 文件信息 */}
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-gray-500 dark:text-gray-400">文件名</span>
              <span className="text-gray-900 dark:text-gray-100 font-medium truncate ml-4">
                {zipName}.zip
              </span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-gray-500 dark:text-gray-400">文件数量</span>
              <span className="text-gray-900 dark:text-gray-100 font-medium">
                {frames.length} 帧
              </span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-gray-500 dark:text-gray-400">总大小</span>
              <span className="text-gray-900 dark:text-gray-100 font-medium">
                {formatFileSize(totalSize)}
              </span>
            </div>
          </div>

          {/* 进度条 */}
          <div className="space-y-2">
            <ProgressBar
              value={progress.percent}
              max={100}
              size="lg"
              showLabel
              variant={
                hasError ? 'error' :
                isCompleted ? 'success' :
                isCancelled ? 'warning' : 'default'
              }
              animated={isDownloading}
            />
            {isDownloading && (
              <div className="flex justify-between text-xs text-gray-500 dark:text-gray-400">
                <span>
                  已处理 {progress.current} / {progress.total} 帧
                </span>
                <span>{progress.percent}%</span>
              </div>
            )}
          </div>

          {/* 错误信息 */}
          {hasError && progress.error && (
            <div className="p-3 rounded-lg bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 text-sm">
              {progress.error}
            </div>
          )}
        </div>

        {/* 底部按钮 */}
        <div className="px-6 py-4 border-t border-gray-200 dark:border-gray-700 flex justify-end gap-3">
          {isDownloading ? (
            <Button
              variant="secondary"
              onClick={onCancel}
              leftIcon={<X className="w-4 h-4" />}
            >
              取消下载
            </Button>
          ) : (
            <Button variant="primary" onClick={onClose}>
              {isCompleted ? '完成' : '关闭'}
            </Button>
          )}
        </div>
      </div>
    </div>
  );
});

export default DownloadProgressModal;
