/**
 * Video Frame Extractor - Video Metadata Utility
 * 视频元数据提取工具
 */

import type { VideoInfo } from '../types/state';

/**
 * 提取视频元数据选项
 */
export interface ExtractMetadataOptions {
  /** 视频文件 */
  file: File;
  /** 超时时间（毫秒），默认 30000 */
  timeout?: number;
}

/**
 * 提取视频元数据结果
 */
export interface ExtractMetadataResult {
  /** 是否成功 */
  success: boolean;
  /** 视频信息（成功时） */
  videoInfo?: VideoInfo;
  /** 错误消息（失败时） */
  error?: string;
}

/**
 * 格式化时长
 * @param seconds 秒数
 * @returns 格式化后的时长字符串 (HH:MM:SS 或 MM:SS)
 */
export function formatDuration(seconds: number): string {
  if (!isFinite(seconds) || seconds < 0) {
    return '00:00';
  }

  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const secs = Math.floor(seconds % 60);

  const pad = (n: number) => n.toString().padStart(2, '0');

  if (hours > 0) {
    return `${pad(hours)}:${pad(minutes)}:${pad(secs)}`;
  }
  return `${pad(minutes)}:${pad(secs)}`;
}

/**
 * 格式化分辨率
 * @param width 宽度
 * @param height 高度
 * @returns 格式化后的分辨率字符串
 */
export function formatResolution(width: number, height: number): string {
  return `${width} x ${height}`;
}

/**
 * 获取视频格式的显示名称
 * @param format 格式字符串
 * @returns 格式化后的格式名称
 */
export function getFormatDisplayName(format: string): string {
  const formatMap: Record<string, string> = {
    mp4: 'MP4',
    avi: 'AVI',
    mov: 'MOV',
    mkv: 'MKV',
    webm: 'WebM',
    flv: 'FLV',
  };
  return formatMap[format.toLowerCase()] || format.toUpperCase();
}

/**
 * 从文件名获取格式
 * @param filename 文件名
 * @returns 格式字符串
 */
function getFormatFromFilename(filename: string): string {
  const lastDotIndex = filename.lastIndexOf('.');
  if (lastDotIndex === -1) {
    return 'unknown';
  }
  return filename.slice(lastDotIndex + 1).toLowerCase();
}

/**
 * 提取视频元数据
 * 使用 HTMLVideoElement 加载视频并获取元数据
 * 
 * @param options 提取选项
 * @returns Promise<ExtractMetadataResult>
 */
export async function extractVideoMetadata(
  options: ExtractMetadataOptions
): Promise<ExtractMetadataResult> {
  const { file, timeout = 30000 } = options;

  return new Promise((resolve) => {
    // 创建视频元素
    const video = document.createElement('video');
    const objectUrl = URL.createObjectURL(file);

    // 设置超时
    const timeoutId = setTimeout(() => {
      cleanup();
      resolve({
        success: false,
        error: '加载视频超时，请检查文件是否损坏',
      });
    }, timeout);

    // 清理函数
    const cleanup = () => {
      clearTimeout(timeoutId);
      URL.revokeObjectURL(objectUrl);
      video.src = '';
      video.load();
    };

    // 成功加载元数据
    const handleLoadedMetadata = () => {
      const duration = video.duration;
      const width = video.videoWidth;
      const height = video.videoHeight;

      // 验证获取的数据
      if (!isFinite(duration) || duration <= 0) {
        cleanup();
        resolve({
          success: false,
          error: '无法获取视频时长，文件可能已损坏',
        });
        return;
      }

      if (width <= 0 || height <= 0) {
        cleanup();
        resolve({
          success: false,
          error: '无法获取视频分辨率，文件可能已损坏',
        });
        return;
      }

      const videoInfo: VideoInfo = {
        filename: file.name,
        duration: Math.round(duration * 1000) / 1000, // 保留3位小数
        width,
        height,
        size: file.size,
        format: getFormatFromFilename(file.name),
      };

      cleanup();
      resolve({
        success: true,
        videoInfo,
      });
    };

    // 错误处理
    const handleError = () => {
      cleanup();
      resolve({
        success: false,
        error: getVideoErrorMessage(video.error),
      });
    };

    // 绑定事件
    video.addEventListener('loadedmetadata', handleLoadedMetadata);
    video.addEventListener('error', handleError);

    // 设置视频源并开始加载
    video.preload = 'metadata';
    video.src = objectUrl;
    video.load();
  });
}

/**
 * 获取视频错误消息
 * @param error MediaError 对象
 * @returns 用户友好的错误消息
 */
function getVideoErrorMessage(error: MediaError | null): string {
  if (!error) {
    return '加载视频时发生未知错误';
  }

  switch (error.code) {
    case MediaError.MEDIA_ERR_ABORTED:
      return '视频加载被中止';
    case MediaError.MEDIA_ERR_NETWORK:
      return '网络错误导致视频加载失败';
    case MediaError.MEDIA_ERR_DECODE:
      return '视频解码失败，文件可能已损坏或格式不支持';
    case MediaError.MEDIA_ERR_SRC_NOT_SUPPORTED:
      return '不支持的视频格式';
    default:
      return `加载视频失败: ${error.message || '未知错误'}`;
  }
}

/**
 * 创建视频预览 URL
 * @param file 视频文件
 * @returns Object URL
 */
export function createVideoPreviewUrl(file: File): string {
  return URL.createObjectURL(file);
}

/**
 * 释放视频预览 URL
 * @param url Object URL
 */
export function revokeVideoPreviewUrl(url: string): void {
  URL.revokeObjectURL(url);
}

/**
 * 获取视频缩略图
 * @param file 视频文件
 * @param time 截取时间点（秒），默认为 0
 * @returns Promise<Blob | null> 缩略图 Blob
 */
export async function getVideoThumbnail(
  file: File,
  time: number = 0
): Promise<Blob | null> {
  return new Promise((resolve) => {
    const video = document.createElement('video');
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    const objectUrl = URL.createObjectURL(file);

    const cleanup = () => {
      URL.revokeObjectURL(objectUrl);
      video.src = '';
      video.load();
    };

    video.addEventListener('loadeddata', () => {
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;

      video.currentTime = time;
    });

    video.addEventListener('seeked', () => {
      if (!ctx) {
        cleanup();
        resolve(null);
        return;
      }

      ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

      canvas.toBlob(
        (blob) => {
          cleanup();
          resolve(blob);
        },
        'image/jpeg',
        0.8
      );
    });

    video.addEventListener('error', () => {
      cleanup();
      resolve(null);
    });

    video.preload = 'metadata';
    video.src = objectUrl;
    video.load();
  });
}
