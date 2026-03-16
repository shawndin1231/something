/**
 * Web Worker 消息类型定义
 * 用于主线程与 FFmpeg Worker 之间的通信
 */

// 错误代码类型
export type ErrorCode =
  | 'MEMORY_EXCEEDED'
  | 'FFMPEG_LOAD_FAILED'
  | 'VIDEO_DECODE_ERROR'
  | 'UNSUPPORTED_FORMAT'
  | 'UNKNOWN_ERROR';

// 提取配置接口
export interface ExtractConfig {
  /** 帧提取间隔（秒） */
  interval: number;
  /** 输出格式 (png, jpg, webp) */
  format: 'png' | 'jpg' | 'webp';
  /** 图像质量 (1-100) */
  quality: number;
  /** 输出宽度（可选，保持宽高比） */
  width?: number;
  /** 输出高度（可选，保持宽高比） */
  height?: number;
  /** 开始时间（秒） */
  startTime?: number;
  /** 结束时间（秒） */
  endTime?: number;
}

// 帧数据接口
export interface FrameData {
  /** 帧唯一标识 */
  id: string;
  /** 文件名 */
  filename: string;
  /** 时间戳（秒） */
  timestamp: number;
  /** 图像 Blob 数据 */
  blob: Blob;
  /** 文件大小（字节） */
  size: number;
  /** 图像宽度 */
  width: number;
  /** 图像高度 */
  height: number;
}

// 初始化消息
export interface InitMessage {
  type: 'INIT';
}

// 加载视频消息
export interface LoadVideoMessage {
  type: 'LOAD_VIDEO';
  /** 视频文件数据 */
  videoData: ArrayBuffer;
  /** 视频文件名 */
  filename: string;
}

// 提取帧消息
export interface ExtractFramesMessage {
  type: 'EXTRACT_FRAMES';
  /** 提取配置 */
  config: ExtractConfig;
}

// 取消消息
export interface CancelMessage {
  type: 'CANCEL';
}

// 进度消息
export interface ProgressMessage {
  type: 'PROGRESS';
  /** 当前进度 (0-100) */
  progress: number;
  /** 当前处理的帧数 */
  currentFrame: number;
  /** 总帧数 */
  totalFrames: number;
  /** 当前阶段描述 */
  stage: 'loading' | 'extracting' | 'encoding' | 'complete';
}

// 帧就绪消息
export interface FrameReadyMessage {
  type: 'FRAME_READY';
  /** 帧数据 */
  frame: FrameData;
}

// 完成消息
export interface CompleteMessage {
  type: 'COMPLETE';
  /** 所有提取的帧数据 */
  frames: FrameData[];
  /** 总耗时（毫秒） */
  duration: number;
}

// 错误消息
export interface ErrorMessage {
  type: 'ERROR';
  /** 错误代码 */
  code: ErrorCode;
  /** 错误消息 */
  message: string;
  /** 详细错误信息 */
  details?: string;
}

// Worker 消息联合类型
export type WorkerMessage =
  | InitMessage
  | LoadVideoMessage
  | ExtractFramesMessage
  | CancelMessage
  | ProgressMessage
  | FrameReadyMessage
  | CompleteMessage
  | ErrorMessage;

// 主线程发送给 Worker 的消息类型
export type MainThreadMessage =
  | InitMessage
  | LoadVideoMessage
  | ExtractFramesMessage
  | CancelMessage;

// Worker 发送给主线程的消息类型
export type WorkerThreadMessage =
  | ProgressMessage
  | FrameReadyMessage
  | CompleteMessage
  | ErrorMessage;

// Worker 状态
export type WorkerStatus =
  | 'idle'
  | 'loading'
  | 'ready'
  | 'processing'
  | 'error';

// Worker 上下文接口
export interface WorkerContext {
  /** 当前状态 */
  status: WorkerStatus;
  /** 是否已取消 */
  isCancelled: boolean;
  /** 视频文件名 */
  videoFilename: string | null;
  /** 视频时长 */
  videoDuration: number | null;
}
