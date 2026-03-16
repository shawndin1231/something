/**
 * FFmpeg Worker 通信 Hook
 * 管理 Web Worker 实例和消息通信
 */

import { useCallback, useEffect, useRef, useState } from 'react';
import type {
  WorkerThreadMessage,
  ExtractConfig,
  FrameData,
  WorkerStatus,
  ProgressMessage,
} from '@/types/worker';

// Worker 构造函数类型
type FFmpegWorker = Worker;

// Hook 配置选项
interface UseFFmpegWorkerOptions {
  /** Worker 初始化完成回调 */
  onReady?: () => void;
  /** 进度更新回调 */
  onProgress?: (progress: ProgressMessage) => void;
  /** 帧就绪回调 */
  onFrameReady?: (frame: FrameData) => void;
  /** 提取完成回调 */
  onComplete?: (frames: FrameData[], duration: number) => void;
  /** 错误回调 */
  onError?: (code: string, message: string, details?: string) => void;
}

// Hook 返回值
interface UseFFmpegWorkerReturn {
  /** Worker 状态 */
  status: WorkerStatus;
  /** 是否正在处理 */
  isProcessing: boolean;
  /** 当前进度 */
  progress: ProgressMessage | null;
  /** 初始化 Worker */
  init: () => Promise<void>;
  /** 加载视频 */
  loadVideo: (file: File) => Promise<void>;
  /** 提取帧 */
  extractFrames: (config: ExtractConfig) => Promise<FrameData[]>;
  /** 取消操作 */
  cancel: () => void;
  /** 终止 Worker */
  terminate: () => void;
}

/**
 * FFmpeg Worker 通信 Hook
 */
export function useFFmpegWorker(
  options: UseFFmpegWorkerOptions = {}
): UseFFmpegWorkerReturn {
  const {
    onReady,
    onProgress,
    onFrameReady,
    onComplete,
    onError,
  } = options;

  // Worker 实例引用
  const workerRef = useRef<FFmpegWorker | null>(null);

  // 状态
  const [status, setStatus] = useState<WorkerStatus>('idle');
  const [progress, setProgress] = useState<ProgressMessage | null>(null);

  // 提取完成 Promise 解决函数
  const extractResolveRef = useRef<((frames: FrameData[]) => void) | null>(null);
  const extractRejectRef = useRef<((error: Error) => void) | null>(null);

  // 累积帧数据
  const framesRef = useRef<FrameData[]>([]);

  /**
   * 创建 Worker 实例
   */
  const createWorker = useCallback((): FFmpegWorker => {
    // Vite 会自动处理 Worker 文件
    const worker = new Worker(
      new URL('@/workers/ffmpeg.worker.ts', import.meta.url),
      { type: 'module' }
    );

    // 消息处理器
    worker.onmessage = (event: MessageEvent<WorkerThreadMessage>) => {
      const message = event.data;

      switch (message.type) {
        case 'PROGRESS': {
          setProgress(message);
          onProgress?.(message);

          // 根据阶段更新状态
          if (message.stage === 'loading') {
            setStatus(message.progress >= 100 ? 'ready' : 'loading');
          } else if (message.stage === 'extracting' || message.stage === 'encoding') {
            setStatus('processing');
          }
          break;
        }

        case 'FRAME_READY': {
          framesRef.current.push(message.frame);
          onFrameReady?.(message.frame);
          break;
        }

        case 'COMPLETE': {
          setStatus('idle');
          setProgress(null);
          onComplete?.(message.frames, message.duration);

          // 解决提取 Promise
          if (extractResolveRef.current) {
            extractResolveRef.current(message.frames);
            extractResolveRef.current = null;
            extractRejectRef.current = null;
          }
          break;
        }

        case 'ERROR': {
          setStatus('error');
          onError?.(message.code, message.message, message.details);

          // 拒绝提取 Promise
          if (extractRejectRef.current) {
            extractRejectRef.current(new Error(`${message.code}: ${message.message}`));
            extractResolveRef.current = null;
            extractRejectRef.current = null;
          }
          break;
        }
      }
    };

    // 错误处理器
    worker.onerror = (error: ErrorEvent) => {
      setStatus('error');
      onError?.('UNKNOWN_ERROR', 'Worker error', error.message);

      // 拒绝提取 Promise
      if (extractRejectRef.current) {
        extractRejectRef.current(new Error(error.message));
        extractResolveRef.current = null;
        extractRejectRef.current = null;
      }
    };

    return worker;
  }, [onProgress, onFrameReady, onComplete, onError]);

  /**
   * 初始化 Worker
   */
  const init = useCallback(async (): Promise<void> => {
    return new Promise((resolve, reject) => {
      if (!workerRef.current) {
        workerRef.current = createWorker();
      }

      // 设置一次性消息监听器等待初始化完成
      const handler = (event: MessageEvent<WorkerThreadMessage>) => {
        const message = event.data;
        if (message.type === 'PROGRESS' && message.stage === 'loading' && message.progress >= 100) {
          workerRef.current?.removeEventListener('message', handler);
          setStatus('ready');
          onReady?.();
          resolve();
        } else if (message.type === 'ERROR') {
          workerRef.current?.removeEventListener('message', handler);
          reject(new Error(`${message.code}: ${message.message}`));
        }
      };

      workerRef.current.addEventListener('message', handler);
      workerRef.current.postMessage({ type: 'INIT' });
      setStatus('loading');
    });
  }, [createWorker, onReady]);

  /**
   * 加载视频文件
   */
  const loadVideo = useCallback(async (file: File): Promise<void> => {
    return new Promise((resolve, reject) => {
      if (!workerRef.current) {
        reject(new Error('Worker not initialized'));
        return;
      }

      const handler = (event: MessageEvent<WorkerThreadMessage>) => {
        const message = event.data;
        if (message.type === 'PROGRESS' && message.stage === 'loading' && message.progress >= 100) {
          workerRef.current?.removeEventListener('message', handler);
          resolve();
        } else if (message.type === 'ERROR') {
          workerRef.current?.removeEventListener('message', handler);
          reject(new Error(`${message.code}: ${message.message}`));
        }
      };

      workerRef.current.addEventListener('message', handler);

      // 读取文件为 ArrayBuffer
      const reader = new FileReader();
      reader.onload = () => {
        const videoData = reader.result as ArrayBuffer;
        workerRef.current?.postMessage({
          type: 'LOAD_VIDEO',
          videoData,
          filename: file.name,
        });
      };
      reader.onerror = () => {
        reject(new Error('Failed to read video file'));
      };
      reader.readAsArrayBuffer(file);
    });
  }, []);

  /**
   * 提取视频帧
   */
  const extractFrames = useCallback(async (config: ExtractConfig): Promise<FrameData[]> => {
    return new Promise((resolve, reject) => {
      if (!workerRef.current) {
        reject(new Error('Worker not initialized'));
        return;
      }

      // 重置帧数据
      framesRef.current = [];

      // 保存 Promise 解决函数
      extractResolveRef.current = resolve;
      extractRejectRef.current = reject;

      // 发送提取消息
      workerRef.current.postMessage({
        type: 'EXTRACT_FRAMES',
        config,
      });

      setStatus('processing');
    });
  }, []);

  /**
   * 取消当前操作
   */
  const cancel = useCallback((): void => {
    if (workerRef.current) {
      workerRef.current.postMessage({ type: 'CANCEL' });
      setStatus('idle');
      setProgress(null);

      // 拒绝提取 Promise
      if (extractRejectRef.current) {
        extractRejectRef.current(new Error('Operation cancelled'));
        extractResolveRef.current = null;
        extractRejectRef.current = null;
      }
    }
  }, []);

  /**
   * 终止 Worker
   */
  const terminate = useCallback((): void => {
    if (workerRef.current) {
      workerRef.current.terminate();
      workerRef.current = null;
      setStatus('idle');
      setProgress(null);
      framesRef.current = [];
    }
  }, []);

  // 组件卸载时清理
  useEffect(() => {
    return () => {
      if (workerRef.current) {
        workerRef.current.terminate();
        workerRef.current = null;
      }
    };
  }, []);

  return {
    status,
    isProcessing: status === 'processing',
    progress,
    init,
    loadVideo,
    extractFrames,
    cancel,
    terminate,
  };
}

export default useFFmpegWorker;
