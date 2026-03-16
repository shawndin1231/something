/**
 * Video Frame Extractor - State Types
 * 定义应用程序的所有状态类型
 */

/**
 * 视频信息接口
 */
export interface VideoInfo {
  /** 文件名 */
  filename: string;
  /** 视频时长（秒） */
  duration: number;
  /** 视频宽度（像素） */
  width: number;
  /** 视频高度（像素） */
  height: number;
  /** 文件大小（字节） */
  size: number;
  /** 视频格式 */
  format: string;
}

/**
 * 提取配置接口
 */
export interface ExtractConfig {
  /** 提取模式：固定间隔或自定义时间点 */
  mode: 'interval' | 'custom';
  /** 提取间隔（秒），mode 为 interval 时使用 */
  interval: number;
  /** 自定义时间点数组（秒），mode 为 custom 时使用 */
  timestamps: number[];
  /** 输出图片格式 */
  format: 'png' | 'jpeg' | 'webp';
  /** 输出图片质量 (1-100)，jpeg 和 webp 格式时使用 */
  quality: number;
  /** 输出图片最大宽度，0 表示不限制 */
  maxWidth: number;
  /** 输出图片最大高度，0 表示不限制 */
  maxHeight: number;
}

/**
 * 进度信息接口
 */
export interface Progress {
  /** 当前已提取的帧数 */
  current: number;
  /** 总帧数 */
  total: number;
  /** 完成百分比 (0-100) */
  percent: number;
  /** 预计剩余时间（秒） */
  estimatedTime: number;
}

/**
 * 应用错误接口
 */
export interface AppError {
  /** 错误代码 */
  code: string;
  /** 错误消息 */
  message: string;
  /** 是否可恢复 */
  recoverable: boolean;
}

/**
 * 提取的帧接口
 */
export interface Frame {
  /** 帧唯一标识 */
  id: string;
  /** 文件名 */
  filename: string;
  /** 时间戳（秒） */
  timestamp: number;
  /** Blob URL 用于预览和下载 */
  blobUrl: string;
  /** 文件大小（字节） */
  size: number;
  /** 图片宽度 */
  width: number;
  /** 图片高度 */
  height: number;
}

/**
 * 应用状态类型联合
 * 使用可辨识联合类型实现状态机
 */
export type AppState =
  | { status: 'idle' }
  | { status: 'ffmpeg_loading'; progress: number }
  | { status: 'video_loading'; progress: number; videoFile?: File }
  | { status: 'configuring'; video: VideoInfo; config: ExtractConfig; videoFile?: File }
  | { status: 'extracting'; video: VideoInfo; config: ExtractConfig; progress: Progress; videoFile?: File }
  | { status: 'completed'; video: VideoInfo; frames: Frame[] }
  | { status: 'error'; error: AppError };

/**
 * 默认提取配置
 */
export const DEFAULT_EXTRACT_CONFIG: ExtractConfig = {
  mode: 'interval',
  interval: 1,
  timestamps: [],
  format: 'png',
  quality: 90,
  maxWidth: 0,
  maxHeight: 0,
};

/**
 * 初始状态
 */
export const INITIAL_STATE: AppState = {
  status: 'idle',
};
