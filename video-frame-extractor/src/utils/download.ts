/**
 * Video Frame Extractor - Download Utilities
 * 下载相关工具函数
 */

import JSZip from 'jszip';
import { saveAs } from 'file-saver';
import type { Frame } from '../types/state';

/**
 * 进度回调函数类型
 */
export type ProgressCallback = (current: number, total: number) => void;

/**
 * 下载单个文件
 * @param blob - 文件 Blob 对象
 * @param filename - 保存的文件名
 */
export function downloadFile(blob: Blob, filename: string): void {
  saveAs(blob, filename);
}

/**
 * 从 Blob URL 获取 Blob 对象
 * @param blobUrl - Blob URL
 * @returns Promise<Blob>
 */
export async function fetchBlobFromUrl(blobUrl: string): Promise<Blob> {
  const response = await fetch(blobUrl);
  if (!response.ok) {
    throw new Error(`Failed to fetch blob: ${response.statusText}`);
  }
  return response.blob();
}

/**
 * 生成帧文件名
 * @param index - 帧索引（从 1 开始）
 * @param format - 图片格式
 * @returns 文件名，如 frame_001.jpg
 */
export function generateFrameFilename(index: number, format: 'png' | 'jpeg' | 'webp' = 'png'): string {
  const extension = format === 'jpeg' ? 'jpg' : format;
  return `frame_${String(index).padStart(3, '0')}.${extension}`;
}

/**
 * 从帧数据中提取图片格式
 * @param frame - 帧数据
 * @returns 图片格式
 */
export function extractFormatFromFrame(frame: Frame): 'png' | 'jpeg' | 'webp' {
  const filename = frame.filename.toLowerCase();
  if (filename.endsWith('.jpg') || filename.endsWith('.jpeg')) {
    return 'jpeg';
  }
  if (filename.endsWith('.webp')) {
    return 'webp';
  }
  return 'png';
}

/**
 * ZIP 下载选项
 */
export interface ZipDownloadOptions {
  /** ZIP 文件名 */
  zipName: string;
  /** 进度回调 */
  onProgress?: ProgressCallback;
  /** 取消信号 */
  abortSignal?: AbortSignal;
}

/**
 * 将帧打包为 ZIP 并下载
 * @param frames - 帧数据数组
 * @param options - 下载选项
 * @returns Promise<void>
 */
export async function downloadFramesAsZip(
  frames: Frame[],
  options: ZipDownloadOptions
): Promise<void> {
  const { zipName, onProgress, abortSignal } = options;
  const zip = new JSZip();
  const total = frames.length;

  // 检查是否已取消
  if (abortSignal?.aborted) {
    throw new Error('Download cancelled');
  }

  // 添加文件到 ZIP
  for (let i = 0; i < frames.length; i++) {
    // 检查取消信号
    if (abortSignal?.aborted) {
      throw new Error('Download cancelled');
    }

    const frame = frames[i];
    const format = extractFormatFromFrame(frame);
    const filename = generateFrameFilename(i + 1, format);

    try {
      const blob = await fetchBlobFromUrl(frame.blobUrl);
      zip.file(filename, blob);

      // 更新进度
      if (onProgress) {
        onProgress(i + 1, total);
      }
    } catch (error) {
      console.error(`Failed to add frame ${filename} to ZIP:`, error);
      // 继续处理其他帧
    }
  }

  // 生成 ZIP 文件
  const zipBlob = await zip.generateAsync({
    type: 'blob',
    compression: 'DEFLATE',
    compressionOptions: { level: 6 },
  }, (metadata) => {
    // ZIP 生成进度
    if (onProgress) {
      // 将 ZIP 生成进度映射到总进度
      const effectiveProgress = total + Math.floor(metadata.percent / 100 * total * 0.2);
      onProgress(Math.min(effectiveProgress, Math.floor(total * 1.2)), Math.floor(total * 1.2));
    }
  });

  // 检查取消信号
  if (abortSignal?.aborted) {
    throw new Error('Download cancelled');
  }

  // 下载 ZIP 文件
  saveAs(zipBlob, zipName.endsWith('.zip') ? zipName : `${zipName}.zip`);
}

/**
 * 格式化文件大小
 * @param bytes - 字节数
 * @returns 格式化后的字符串
 */
export function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 B';
  
  const units = ['B', 'KB', 'MB', 'GB'];
  const k = 1024;
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(2))} ${units[i]}`;
}

/**
 * 计算帧总大小
 * @param frames - 帧数据数组
 * @returns 总字节数
 */
export function calculateTotalSize(frames: Frame[]): number {
  return frames.reduce((total, frame) => total + frame.size, 0);
}
