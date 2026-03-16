/**
 * FFmpeg Web Worker
 * 在独立线程中处理视频帧提取任务
 */

import { FFmpeg } from '@ffmpeg/ffmpeg';
import { toBlobURL } from '@ffmpeg/util';
import type {
  MainThreadMessage,
  WorkerThreadMessage,
  ExtractConfig,
  FrameData,
  ErrorCode,
} from '@/types/worker';

// CDN 配置
const CDN_SOURCES = [
  {
    name: 'unpkg',
    coreURL: 'https://unpkg.com/@ffmpeg/core@0.12.6/dist/esm/ffmpeg-core.js',
    wasmURL: 'https://unpkg.com/@ffmpeg/core@0.12.6/dist/esm/ffmpeg-core.wasm',
  },
  {
    name: 'jsdelivr',
    coreURL: 'https://cdn.jsdelivr.net/npm/@ffmpeg/core@0.12.6/dist/esm/ffmpeg-core.js',
    wasmURL: 'https://cdn.jsdelivr.net/npm/@ffmpeg/core@0.12.6/dist/esm/ffmpeg-core.wasm',
  },
] as const;

// Worker 状态
type WorkerStatus = 'idle' | 'loading' | 'ready' | 'processing' | 'error';

// Worker 上下文接口
interface WorkerContext {
  /** 当前状态 */
  status: WorkerStatus;
  /** 是否已取消 */
  isCancelled: boolean;
  /** 视频文件名 */
  videoFilename: string | null;
  /** 视频时长 */
  videoDuration: number | null;
}

// Worker 上下文状态
const context: WorkerContext = {
  status: 'idle',
  isCancelled: false,
  videoFilename: null,
  videoDuration: null,
};

// FFmpeg 实例
let ffmpeg: FFmpeg | null = null;
let videoBuffer: ArrayBuffer | null = null;

/**
 * 发送消息到主线程
 */
function postMessageToMain(message: WorkerThreadMessage): void {
  self.postMessage(message);
}

/**
 * 报告进度
 */
function reportProgress(
  progress: number,
  currentFrame: number,
  totalFrames: number,
  stage: 'loading' | 'extracting' | 'encoding' | 'complete'
): void {
  postMessageToMain({
    type: 'PROGRESS',
    progress,
    currentFrame,
    totalFrames,
    stage,
  });
}

/**
 * 发送错误消息
 */
function sendError(
  code: ErrorCode,
  message: string,
  details?: string
): void {
  postMessageToMain({
    type: 'ERROR',
    code,
    message,
    details,
  });
  context.status = 'error';
}

/**
 * 从 CDN 加载 FFmpeg
 */
async function loadFFmpegFromCDN(
  cdn: (typeof CDN_SOURCES)[number],
  onProgress: (progress: number, stage: string) => void
): Promise<FFmpeg> {
  const ffmpegInstance = new FFmpeg();

  // 设置日志回调
  ffmpegInstance.on('log', ({ message }) => {
    console.log('[FFmpeg Worker]', message);
  });

  onProgress(10, `Loading core from ${cdn.name}...`);

  const coreBlobURL = await toBlobURL(
    cdn.coreURL,
    'text/javascript',
    true,
    ({ received, total }) => {
      const progress = total > 0 ? received / total : 0;
      onProgress(10 + progress * 30, 'Downloading core...');
    }
  );

  onProgress(40, 'Downloading WASM...');

  const wasmBlobURL = await toBlobURL(
    cdn.wasmURL,
    'application/wasm',
    true,
    ({ received, total }) => {
      const progress = total > 0 ? received / total : 0;
      onProgress(40 + progress * 40, 'Downloading WASM...');
    }
  );

  onProgress(80, 'Initializing...');

  await ffmpegInstance.load({
    coreURL: coreBlobURL,
    wasmURL: wasmBlobURL,
  });

  return ffmpegInstance;
}

/**
 * 初始化 FFmpeg（多 CDN 策略）
 */
async function initializeFFmpeg(): Promise<void> {
  context.status = 'loading';
  reportProgress(0, 0, 0, 'loading');

  // 如果已经加载，直接返回
  if (ffmpeg?.loaded) {
    context.status = 'ready';
    reportProgress(100, 0, 0, 'loading');
    return;
  }

  let lastError: Error | null = null;

  // 尝试从不同 CDN 加载
  for (const cdn of CDN_SOURCES) {
    try {
      ffmpeg = await loadFFmpegFromCDN(
        cdn,
        (progress, _stage) => {
          reportProgress(progress, 0, 0, 'loading');
        }
      );

      context.status = 'ready';
      reportProgress(100, 0, 0, 'loading');
      return;
    } catch (error) {
      lastError = error instanceof Error ? error : new Error('Unknown error');
      console.warn(`Failed to load FFmpeg from ${cdn.name}:`, lastError.message);
    }
  }

  // 所有 CDN 都失败
  sendError(
    'FFMPEG_LOAD_FAILED',
    'Failed to load FFmpeg from all CDN sources',
    lastError?.message
  );
  throw lastError;
}

/**
 * 加载视频文件
 */
async function loadVideo(videoData: ArrayBuffer, filename: string): Promise<void> {
  if (!ffmpeg || !ffmpeg.loaded) {
    sendError('FFMPEG_LOAD_FAILED', 'FFmpeg not initialized');
    return;
  }

  try {
    videoBuffer = videoData;
    context.videoFilename = filename;

    // 写入视频文件到虚拟文件系统
    const inputFilename = 'input.mp4';
    await ffmpeg.writeFile(inputFilename, new Uint8Array(videoData));

    // 获取视频信息（使用 ffprobe 格式输出）
    // FFmpeg.wasm 不直接支持 ffprobe，我们通过解析输出来获取时长
    // 先尝试获取视频信息
    let duration = 0;

    try {
      // 使用 -i 参数获取视频信息
      // 由于 FFmpeg.wasm 的限制，我们需要通过其他方式获取时长
      // 这里使用一个简单的方法：提取最后一帧的时间戳

      // 临时方案：假设视频时长，实际项目中应该使用更可靠的方法
      // 例如：使用 video 元素获取时长，或者解析视频文件头
      duration = 0; // 将在 extractFrames 中处理
    } catch {
      // 忽略错误
    }

    context.videoDuration = duration || null;
    reportProgress(100, 0, 0, 'loading');
  } catch (error) {
    sendError(
      'VIDEO_DECODE_ERROR',
      'Failed to load video file',
      error instanceof Error ? error.message : 'Unknown error'
    );
    throw error;
  }
}

/**
 * 构建帧提取 FFmpeg 命令
 */
function buildExtractCommand(config: ExtractConfig, outputPattern: string): string[] {
  const args: string[] = [];

  // 输入文件
  args.push('-i', 'input.mp4');

  // 时间范围处理
  if (config.startTime && config.startTime > 0) {
    // -ss 放在 -i 后面是输出选项，更精确但更慢
    args.push('-ss', config.startTime.toString());
  }

  if (config.endTime && config.endTime > (config.startTime ?? 0)) {
    const duration = config.endTime - (config.startTime ?? 0);
    args.push('-t', duration.toString());
  }

  // 视频滤镜
  const filters: string[] = [];

  // 帧率控制：每 interval 秒提取一帧
  // fps=1/interval 表示每 interval 秒一帧
  filters.push(`fps=1/${config.interval}`);

  // 缩放
  if (config.width || config.height) {
    if (config.width && config.height) {
      filters.push(`scale=${config.width}:${config.height}`);
    } else if (config.width) {
      // 保持宽高比，高度自动计算
      filters.push(`scale=${config.width}:-1`);
    } else {
      // 保持宽高比，宽度自动计算
      filters.push(`scale=-1:${config.height}`);
    }
  }

  if (filters.length > 0) {
    args.push('-vf', filters.join(','));
  }

  // 质量设置
  const quality = Math.max(1, Math.min(100, config.quality));

  switch (config.format) {
    case 'jpg':
      // JPEG 质量 (1-31, 越小质量越高)
      const jpegQuality = Math.round(31 - (quality / 100) * 30);
      args.push('-q:v', jpegQuality.toString());
      break;
    case 'webp':
      // WebP 质量 (0-100)
      args.push('-quality', quality.toString());
      break;
    case 'png':
      // PNG 压缩级别 (0-9)
      const pngCompression = Math.round(9 - (quality / 100) * 9);
      args.push('-compression_level', pngCompression.toString());
      break;
  }

  // 输出格式
  args.push('-f', 'image2');

  // 输出文件模式
  args.push(outputPattern);

  return args;
}

/**
 * 提取视频帧
 */
async function extractFrames(config: ExtractConfig): Promise<FrameData[]> {
  if (!ffmpeg || !ffmpeg.loaded) {
    sendError('FFMPEG_LOAD_FAILED', 'FFmpeg not initialized');
    return [];
  }

  if (!videoBuffer) {
    sendError('VIDEO_DECODE_ERROR', 'No video loaded');
    return [];
  }

  context.status = 'processing';
  context.isCancelled = false;

  const frames: FrameData[] = [];

  try {
    // 计算需要提取的帧数
    const startTime = config.startTime ?? 0;
    const endTime = config.endTime ?? (context.videoDuration ?? 0);

    // 如果没有时长信息，使用一个大值
    const effectiveEndTime = endTime > 0 ? endTime : 3600; // 默认最大 1 小时
    const duration = effectiveEndTime - startTime;
    const totalFrames = Math.ceil(duration / config.interval);

    // 输出文件名模式
    const format = config.format === 'jpg' ? 'jpg' : config.format;
    const outputPattern = `frame_%04d.${format}`;

    // 构建 FFmpeg 命令
    const args = buildExtractCommand(config, outputPattern);

    console.log('[FFmpeg Worker] Executing:', args.join(' '));

    // 设置进度监听
    let lastProgress = 0;
    ffmpeg.on('progress', ({ progress }) => {
      if (context.isCancelled) return;

      const percent = Math.round(progress * 100);
      const currentFrame = Math.round(progress * totalFrames);

      if (percent !== lastProgress) {
        lastProgress = percent;
        reportProgress(percent, currentFrame, totalFrames, 'extracting');
      }
    });

    // 执行提取命令
    await ffmpeg.exec(args);

    // 检查是否已取消
    if (context.isCancelled) {
      return [];
    }

    // 读取提取的帧
    reportProgress(0, 0, totalFrames, 'encoding');

    for (let i = 1; i <= totalFrames; i++) {
      if (context.isCancelled) {
        break;
      }

      const frameFilename = `frame_${i.toString().padStart(4, '0')}.${format}`;

      try {
        const frameData = await ffmpeg.readFile(frameFilename);

        if (frameData instanceof Uint8Array && frameData.length > 0) {
          const timestamp = startTime + (i - 1) * config.interval;

          // 创建 Blob
          const mimeType = format === 'jpg' ? 'image/jpeg' : `image/${format}`;
          // 创建一个新的 Uint8Array 副本以确保使用普通 ArrayBuffer
          const frameDataCopy = new Uint8Array(frameData);
          const blob = new Blob([frameDataCopy], { type: mimeType });

          const frame: FrameData = {
            id: `frame-${i.toString().padStart(4, '0')}`,
            filename: frameFilename,
            timestamp,
            blob,
            size: frameData.length,
            width: config.width ?? 1920,
            height: config.height ?? 1080,
          };

          frames.push(frame);

          // 发送帧就绪消息
          postMessageToMain({
            type: 'FRAME_READY',
            frame,
          });

          // 更新编码进度
          reportProgress(
            Math.round((i / totalFrames) * 100),
            i,
            totalFrames,
            'encoding'
          );
        }

        // 清理已读取的帧文件以释放内存
        try {
          await ffmpeg.deleteFile(frameFilename);
        } catch {
          // 忽略删除错误
        }
      } catch {
        // 帧文件可能不存在（视频结束），跳过
        break;
      }
    }

    return frames;
  } catch (error) {
    sendError(
      'VIDEO_DECODE_ERROR',
      'Failed to extract frames',
      error instanceof Error ? error.message : 'Unknown error'
    );
    throw error;
  }
}

/**
 * 取消当前操作
 */
function cancelOperation(): void {
  context.isCancelled = true;
  context.status = 'idle';
}

/**
 * 清理资源
 */
async function cleanup(): Promise<void> {
  if (ffmpeg && ffmpeg.loaded) {
    try {
      // 删除输入文件
      await ffmpeg.deleteFile('input.mp4');
    } catch {
      // 忽略错误
    }

    // 列出并删除所有帧文件
    try {
      const files = await ffmpeg.listDir('/');
      for (const file of files) {
        if (file.name.startsWith('frame_')) {
          try {
            await ffmpeg.deleteFile(file.name);
          } catch {
            // 忽略错误
          }
        }
      }
    } catch {
      // 忽略错误
    }
  }

  videoBuffer = null;
}

/**
 * 消息处理器
 */
self.onmessage = async (event: MessageEvent<MainThreadMessage>) => {
  const { type } = event.data;

  switch (type) {
    case 'INIT': {
      await initializeFFmpeg();
      break;
    }

    case 'LOAD_VIDEO': {
      const { videoData, filename } = event.data;
      await loadVideo(videoData, filename);
      break;
    }

    case 'EXTRACT_FRAMES': {
      const { config } = event.data;
      const startTime = performance.now();

      const frames = await extractFrames(config);
      const duration = performance.now() - startTime;

      if (!context.isCancelled) {
        postMessageToMain({
          type: 'COMPLETE',
          frames,
          duration,
        });
      }

      // 清理资源
      await cleanup();
      context.status = 'idle';
      break;
    }

    case 'CANCEL': {
      cancelOperation();
      break;
    }

    default: {
      sendError('UNKNOWN_ERROR', `Unknown message type: ${(event.data as { type: string }).type}`);
    }
  }
};

// 导出类型以供类型检查使用
export type { MainThreadMessage, WorkerThreadMessage };
