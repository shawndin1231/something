/**
 * Video Frame Extractor - Action Types
 * 定义应用程序的所有 Action 类型
 */

import type {
  VideoInfo,
  ExtractConfig,
  Progress,
  AppError,
  Frame,
} from './state';

/**
 * Action 类型常量
 */
export const ActionType = {
  /** 开始加载 FFmpeg */
  LOAD_FFMPEG: 'LOAD_FFMPEG',
  /** FFmpeg 加载进度更新 */
  LOAD_FFMPEG_PROGRESS: 'LOAD_FFMPEG_PROGRESS',
  /** FFmpeg 加载完成 */
  FFMPEG_READY: 'FFMPEG_READY',
  /** 开始加载视频 */
  LOAD_VIDEO: 'LOAD_VIDEO',
  /** 视频加载完成 */
  VIDEO_LOADED: 'VIDEO_LOADED',
  /** 更新配置 */
  UPDATE_CONFIG: 'UPDATE_CONFIG',
  /** 开始提取 */
  START_EXTRACT: 'START_EXTRACT',
  /** 更新提取进度 */
  UPDATE_PROGRESS: 'UPDATE_PROGRESS',
  /** 提取完成 */
  COMPLETE: 'COMPLETE',
  /** 发生错误 */
  ERROR: 'ERROR',
  /** 重置状态 */
  RESET: 'RESET',
  /** 删除帧 */
  DELETE_FRAMES: 'DELETE_FRAMES',
} as const;

/**
 * Action 类型定义
 */
export type AppAction =
  | { type: typeof ActionType.LOAD_FFMPEG }
  | { type: typeof ActionType.LOAD_FFMPEG_PROGRESS; payload: { progress: number } }
  | { type: typeof ActionType.FFMPEG_READY }
  | {
      type: typeof ActionType.LOAD_VIDEO;
      payload: {
        progress: number;
        videoFile?: File;
      };
    }
  | {
      type: typeof ActionType.VIDEO_LOADED;
      payload: {
        video: VideoInfo;
        videoFile?: File;
      };
    }
  | {
      type: typeof ActionType.UPDATE_CONFIG;
      payload: {
        config: Partial<ExtractConfig>;
      };
    }
  | {
      type: typeof ActionType.START_EXTRACT;
      payload: {
        totalFrames: number;
      };
    }
  | {
      type: typeof ActionType.UPDATE_PROGRESS;
      payload: {
        progress: Progress;
      };
    }
  | {
      type: typeof ActionType.COMPLETE;
      payload: {
        frames: Frame[];
      };
    }
  | {
      type: typeof ActionType.ERROR;
      payload: {
        error: AppError;
      };
    }
  | { type: typeof ActionType.RESET }
  | {
      type: typeof ActionType.DELETE_FRAMES;
      payload: {
        frameIds: string[];
      };
    };

/**
 * Action Creator 函数
 */

/** 创建加载 FFmpeg 的 action */
export const loadFFmpeg = (): AppAction => ({
  type: ActionType.LOAD_FFMPEG,
});

/** 创建 FFmpeg 就绪的 action */
export const ffmpegReady = (): AppAction => ({
  type: ActionType.FFMPEG_READY,
});

/** 创建加载视频的 action */
export const loadVideo = (progress: number, videoFile?: File): AppAction => ({
  type: ActionType.LOAD_VIDEO,
  payload: { progress, videoFile },
});

/** 创建视频加载完成的 action */
export const videoLoaded = (video: VideoInfo, videoFile?: File): AppAction => ({
  type: ActionType.VIDEO_LOADED,
  payload: { video, videoFile },
});

/** 创建更新配置的 action */
export const updateConfig = (config: Partial<ExtractConfig>): AppAction => ({
  type: ActionType.UPDATE_CONFIG,
  payload: { config },
});

/** 创建开始提取的 action */
export const startExtract = (totalFrames: number): AppAction => ({
  type: ActionType.START_EXTRACT,
  payload: { totalFrames },
});

/** 创建更新进度的 action */
export const updateProgress = (progress: Progress): AppAction => ({
  type: ActionType.UPDATE_PROGRESS,
  payload: { progress },
});

/** 创建提取完成的 action */
export const complete = (frames: Frame[]): AppAction => ({
  type: ActionType.COMPLETE,
  payload: { frames },
});

/** 创建错误的 action */
export const setError = (error: AppError): AppAction => ({
  type: ActionType.ERROR,
  payload: { error },
});

/** 创建重置的 action */
export const reset = (): AppAction => ({
  type: ActionType.RESET,
});

/** 创建删除帧的 action */
export const deleteFrames = (frameIds: string[]): AppAction => ({
  type: ActionType.DELETE_FRAMES,
  payload: { frameIds },
});
