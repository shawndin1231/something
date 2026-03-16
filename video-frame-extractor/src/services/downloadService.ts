/**
 * Video Frame Extractor - Download Service
 * 下载服务，处理单帧下载和批量 ZIP 下载
 */

import {
  downloadFile,
  downloadFramesAsZip,
  fetchBlobFromUrl,
  type ProgressCallback,
} from '../utils/download';
import type { Frame } from '../types/state';

/**
 * 下载状态
 */
export type DownloadStatus = 'idle' | 'preparing' | 'downloading' | 'completed' | 'cancelled' | 'error';

/**
 * 下载进度信息
 */
export interface DownloadProgress {
  /** 当前状态 */
  status: DownloadStatus;
  /** 当前已处理数量 */
  current: number;
  /** 总数量 */
  total: number;
  /** 百分比 (0-100) */
  percent: number;
  /** 错误信息 */
  error?: string;
}

/**
 * 下载服务类
 */
export class DownloadService {
  private abortController: AbortController | null = null;

  /**
   * 下载单个帧
   * @param frame - 帧数据
   */
  async downloadSingleFrame(frame: Frame): Promise<void> {
    try {
      const blob = await fetchBlobFromUrl(frame.blobUrl);
      downloadFile(blob, frame.filename);
    } catch (error) {
      console.error('Failed to download frame:', error);
      throw error;
    }
  }

  /**
   * 批量下载帧为 ZIP
   * @param frames - 帧数据数组
   * @param zipName - ZIP 文件名
   * @param onProgress - 进度回调
   * @returns Promise<void>
   */
  async downloadFramesAsZip(
    frames: Frame[],
    zipName: string,
    onProgress?: (progress: DownloadProgress) => void
  ): Promise<void> {
    // 取消之前的下载
    this.cancel();

    // 创建新的 AbortController
    this.abortController = new AbortController();

    const total = frames.length;
    let current = 0;

    const progressCallback: ProgressCallback = (cur, tot) => {
      current = cur;
      const percent = Math.round((cur / tot) * 100);
      onProgress?.({
        status: 'downloading',
        current: cur,
        total: tot,
        percent,
      });
    };

    try {
      // 通知开始准备
      onProgress?.({
        status: 'preparing',
        current: 0,
        total,
        percent: 0,
      });

      await downloadFramesAsZip(frames, {
        zipName,
        onProgress: progressCallback,
        abortSignal: this.abortController.signal,
      });

      // 通知完成
      onProgress?.({
        status: 'completed',
        current: total,
        total,
        percent: 100,
      });
    } catch (error) {
      if (this.abortController?.signal.aborted) {
        onProgress?.({
          status: 'cancelled',
          current,
          total,
          percent: Math.round((current / total) * 100),
        });
      } else {
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';
        onProgress?.({
          status: 'error',
          current,
          total,
          percent: Math.round((current / total) * 100),
          error: errorMessage,
        });
      }
      throw error;
    } finally {
      this.abortController = null;
    }
  }

  /**
   * 取消当前下载
   */
  cancel(): void {
    if (this.abortController) {
      this.abortController.abort();
      this.abortController = null;
    }
  }

  /**
   * 检查是否正在下载
   */
  isDownloading(): boolean {
    return this.abortController !== null && !this.abortController.signal.aborted;
  }
}

// 创建单例实例
export const downloadService = new DownloadService();

// 导出默认实例
export default downloadService;
