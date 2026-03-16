/**
 * Video Frame Extractor - ThumbnailGrid Component
 * 缩略图网格组件，管理所有帧的显示和批量操作
 */

import { useState, useCallback, useMemo, memo } from 'react';
import {
  Download,
  Trash2,
  CheckSquare,
  Square,
  ChevronLeft,
  ChevronRight,
  Image as ImageIcon,
  Package,
} from 'lucide-react';
import { Button, Card } from '../ui';
import { ThumbnailItem } from './ThumbnailItem';
import { ImagePreviewModal } from './ImagePreviewModal';
import { DownloadProgressModal } from '../download';
import { downloadService, type DownloadProgress } from '../../services/downloadService';
import type { Frame } from '../../types/state';

export interface ThumbnailGridProps {
  /** 所有帧数据 */
  frames: Frame[];
  /** 删除帧回调 */
  onDeleteFrames: (frameIds: string[]) => void;
  /** 下载单帧回调 */
  onDownloadFrame: (frame: Frame) => void;
}

/** 每页显示的帧数 */
const FRAMES_PER_PAGE = 50;

/**
 * ThumbnailGrid 组件
 * 显示帧缩略图网格，支持选择、批量操作和分页
 */
export const ThumbnailGrid = memo(function ThumbnailGrid({
  frames,
  onDeleteFrames,
  onDownloadFrame,
}: ThumbnailGridProps) {
  // 选中的帧 ID 集合
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  // 当前页码
  const [currentPage, setCurrentPage] = useState(1);
  // 预览模态框状态
  const [previewFrame, setPreviewFrame] = useState<Frame | null>(null);
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);

  // 下载进度模态框状态
  const [isDownloadModalOpen, setIsDownloadModalOpen] = useState(false);
  const [downloadProgress, setDownloadProgress] = useState<DownloadProgress>({
    status: 'idle',
    current: 0,
    total: 0,
    percent: 0,
  });
  const [downloadingFrames, setDownloadingFrames] = useState<Frame[]>([]);
  const [downloadZipName, setDownloadZipName] = useState('frames');

  // 计算总页数
  const totalPages = Math.ceil(frames.length / FRAMES_PER_PAGE);

  // 当前页的帧
  const currentFrames = useMemo(() => {
    const start = (currentPage - 1) * FRAMES_PER_PAGE;
    const end = start + FRAMES_PER_PAGE;
    return frames.slice(start, end);
  }, [frames, currentPage]);

  // 选中的帧数量
  const selectedCount = selectedIds.size;
  const isAllSelected = selectedCount === frames.length && frames.length > 0;

  // 切换单个帧的选中状态
  const handleSelect = useCallback((frameId: string, selected: boolean) => {
    setSelectedIds((prev) => {
      const newSet = new Set(prev);
      if (selected) {
        newSet.add(frameId);
      } else {
        newSet.delete(frameId);
      }
      return newSet;
    });
  }, []);

  // 全选/取消全选
  const handleSelectAll = useCallback(() => {
    if (isAllSelected) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(frames.map((f) => f.id)));
    }
  }, [isAllSelected, frames]);

  // 清除选择
  const handleClearSelection = useCallback(() => {
    setSelectedIds(new Set());
  }, []);

  // 删除选中的帧
  const handleDeleteSelected = useCallback(() => {
    if (selectedCount > 0) {
      onDeleteFrames(Array.from(selectedIds));
      setSelectedIds(new Set());
    }
  }, [selectedCount, selectedIds, onDeleteFrames]);

  // 开始批量 ZIP 下载
  const startZipDownload = useCallback(
    (framesToDownload: Frame[], zipName: string) => {
      setDownloadingFrames(framesToDownload);
      setDownloadZipName(zipName);
      setDownloadProgress({
        status: 'idle',
        current: 0,
        total: framesToDownload.length,
        percent: 0,
      });
      setIsDownloadModalOpen(true);

      downloadService.downloadFramesAsZip(framesToDownload, zipName, setDownloadProgress);
    },
    []
  );

  // 下载选中帧为 ZIP
  const handleDownloadSelectedAsZip = useCallback(() => {
    if (selectedCount > 0) {
      const selectedFrames = frames.filter((f) => selectedIds.has(f.id));
      startZipDownload(selectedFrames, 'selected_frames');
    }
  }, [selectedCount, selectedIds, frames, startZipDownload]);

  // 下载所有帧为 ZIP
  const handleDownloadAllAsZip = useCallback(() => {
    if (frames.length > 0) {
      startZipDownload(frames, 'all_frames');
    }
  }, [frames, startZipDownload]);

  // 取消下载
  const handleCancelDownload = useCallback(() => {
    downloadService.cancel();
    setDownloadProgress((prev) => ({
      ...prev,
      status: 'cancelled',
    }));
  }, []);

  // 关闭下载模态框
  const handleCloseDownloadModal = useCallback(() => {
    if (downloadProgress.status === 'downloading' || downloadProgress.status === 'preparing') {
      return; // 下载中不允许关闭
    }
    setIsDownloadModalOpen(false);
    setDownloadingFrames([]);
  }, [downloadProgress.status]);

  // 打开预览
  const handlePreview = useCallback((frame: Frame) => {
    setPreviewFrame(frame);
    setIsPreviewOpen(true);
  }, []);

  // 关闭预览
  const handleClosePreview = useCallback(() => {
    setIsPreviewOpen(false);
    setPreviewFrame(null);
  }, []);

  // 预览导航
  const handlePreviewNavigate = useCallback((frame: Frame) => {
    setPreviewFrame(frame);
  }, []);

  // 删除单个帧
  const handleDeleteFrame = useCallback(
    (frameId: string) => {
      onDeleteFrames([frameId]);
      setSelectedIds((prev) => {
        const newSet = new Set(prev);
        newSet.delete(frameId);
        return newSet;
      });
    },
    [onDeleteFrames]
  );

  // 分页导航
  const handlePrevPage = useCallback(() => {
    setCurrentPage((prev) => Math.max(1, prev - 1));
  }, []);

  const handleNextPage = useCallback(() => {
    setCurrentPage((prev) => Math.min(totalPages, prev + 1));
  }, [totalPages]);

  // 如果没有帧
  if (frames.length === 0) {
    return (
      <Card variant="outlined" padding="lg" className="text-center">
        <ImageIcon className="w-16 h-16 mx-auto text-gray-300 dark:text-gray-600 mb-4" />
        <p className="text-gray-500 dark:text-gray-400">暂无提取的帧</p>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      {/* 工具栏 */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        {/* 左侧：选择控制 */}
        <div className="flex items-center gap-3">
          <Button
            variant="ghost"
            size="sm"
            onClick={handleSelectAll}
            leftIcon={
              isAllSelected ? (
                <CheckSquare className="w-4 h-4" />
              ) : (
                <Square className="w-4 h-4" />
              )
            }
          >
            {isAllSelected ? '取消全选' : '全选'}
          </Button>

          {selectedCount > 0 && (
            <>
              <span className="text-sm text-gray-500 dark:text-gray-400">
                已选择 {selectedCount} / {frames.length} 帧
              </span>
              <Button
                variant="ghost"
                size="sm"
                onClick={handleClearSelection}
              >
                清除选择
              </Button>
            </>
          )}
        </div>

        {/* 右侧：批量操作 */}
        <div className="flex items-center gap-2">
          {/* 下载全部按钮 */}
          <Button
            variant="secondary"
            size="sm"
            onClick={handleDownloadAllAsZip}
            leftIcon={<Package className="w-4 h-4" />}
          >
            下载全部 ({frames.length})
          </Button>

          {/* 选中项操作 */}
          {selectedCount > 0 && (
            <>
              <Button
                variant="secondary"
                size="sm"
                onClick={handleDownloadSelectedAsZip}
                leftIcon={<Download className="w-4 h-4" />}
              >
                下载选中 ({selectedCount})
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={handleDeleteSelected}
                leftIcon={<Trash2 className="w-4 h-4" />}
                className="text-red-500 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20"
              >
                删除选中 ({selectedCount})
              </Button>
            </>
          )}
        </div>
      </div>

      {/* 网格 */}
      <div
        className="
          grid gap-4
          grid-cols-2
          sm:grid-cols-3
          md:grid-cols-4
          lg:grid-cols-5
          xl:grid-cols-6
        "
      >
        {currentFrames.map((frame) => (
          <ThumbnailItem
            key={frame.id}
            frame={frame}
            isSelected={selectedIds.has(frame.id)}
            onSelect={handleSelect}
            onPreview={handlePreview}
            onDownload={onDownloadFrame}
            onDelete={handleDeleteFrame}
          />
        ))}
      </div>

      {/* 分页 */}
      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-4 pt-4">
          <Button
            variant="ghost"
            size="sm"
            onClick={handlePrevPage}
            disabled={currentPage === 1}
            leftIcon={<ChevronLeft className="w-4 h-4" />}
          >
            上一页
          </Button>

          <div className="flex items-center gap-2">
            <span className="text-sm text-gray-500 dark:text-gray-400">
              第 {currentPage} / {totalPages} 页
            </span>
            <span className="text-xs text-gray-400 dark:text-gray-500">
              (共 {frames.length} 帧)
            </span>
          </div>

          <Button
            variant="ghost"
            size="sm"
            onClick={handleNextPage}
            disabled={currentPage === totalPages}
            rightIcon={<ChevronRight className="w-4 h-4" />}
          >
            下一页
          </Button>
        </div>
      )}

      {/* 预览模态框 */}
      <ImagePreviewModal
        frame={previewFrame}
        frames={frames}
        isOpen={isPreviewOpen}
        onClose={handleClosePreview}
        onDownload={onDownloadFrame}
        onNavigate={handlePreviewNavigate}
      />

      {/* 下载进度模态框 */}
      <DownloadProgressModal
        isOpen={isDownloadModalOpen}
        onClose={handleCloseDownloadModal}
        onCancel={handleCancelDownload}
        progress={downloadProgress}
        frames={downloadingFrames}
        zipName={downloadZipName}
      />
    </div>
  );
});

export default ThumbnailGrid;
