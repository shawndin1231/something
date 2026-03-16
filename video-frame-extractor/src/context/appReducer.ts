/**
 * Video Frame Extractor - App Reducer
 * 处理所有状态转换的 reducer 函数
 */

import type { AppState, ExtractConfig, Progress } from '../types/state';
import { ActionType, type AppAction } from '../types/actions';
import { DEFAULT_EXTRACT_CONFIG, INITIAL_STATE } from '../types/state';

/**
 * 应用状态 Reducer
 * 
 * 状态转换图:
 * 
 * idle -> ffmpeg_loading (LOAD_FFMPEG)
 * ffmpeg_loading -> idle (FFMPEG_READY)
 * idle -> video_loading (LOAD_VIDEO)
 * video_loading -> video_loaded (VIDEO_LOADED)
 * video_loaded -> configuring (用户开始配置)
 * configuring -> extracting (START_EXTRACT)
 * extracting -> completed (COMPLETE)
 * 任意状态 -> error (ERROR)
 * error/idle -> idle (RESET)
 */
export function appReducer(state: AppState, action: AppAction): AppState {
  switch (action.type) {
    case ActionType.LOAD_FFMPEG: {
      // 从 idle 状态开始加载 FFmpeg
      if (state.status !== 'idle') {
        console.warn(`LOAD_FFMPEG action called in invalid state: ${state.status}`);
        return state;
      }
      return {
        status: 'ffmpeg_loading',
        progress: 0,
      };
    }

    case ActionType.LOAD_FFMPEG_PROGRESS: {
      // 更新 FFmpeg 加载进度
      if (state.status !== 'ffmpeg_loading') {
        console.warn(`LOAD_FFMPEG_PROGRESS action called in invalid state: ${state.status}`);
        return state;
      }
      return {
        ...state,
        progress: action.payload.progress,
      };
    }

    case ActionType.FFMPEG_READY: {
      // FFmpeg 加载完成，返回 idle 状态等待用户操作
      if (state.status !== 'ffmpeg_loading') {
        console.warn(`FFMPEG_READY action called in invalid state: ${state.status}`);
        return state;
      }
      return {
        status: 'idle',
      };
    }

    case ActionType.LOAD_VIDEO: {
      // 开始加载视频文件
      if (state.status !== 'idle') {
        console.warn(`LOAD_VIDEO action called in invalid state: ${state.status}`);
        return state;
      }
      return {
        status: 'video_loading',
        progress: action.payload.progress,
        videoFile: action.payload.videoFile,
      };
    }

    case ActionType.VIDEO_LOADED: {
      // 视频加载完成，进入配置阶段
      if (state.status !== 'video_loading') {
        console.warn(`VIDEO_LOADED action called in invalid state: ${state.status}`);
        return state;
      }
      return {
        status: 'configuring',
        video: action.payload.video,
        config: DEFAULT_EXTRACT_CONFIG,
        videoFile: action.payload.videoFile ?? state.videoFile,
      };
    }

    case ActionType.UPDATE_CONFIG: {
      // 更新提取配置
      if (state.status !== 'configuring') {
        console.warn(`UPDATE_CONFIG action called in invalid state: ${state.status}`);
        return state;
      }
      return {
        ...state,
        config: {
          ...state.config,
          ...action.payload.config,
        } as ExtractConfig,
      };
    }

    case ActionType.START_EXTRACT: {
      // 开始提取帧
      if (state.status !== 'configuring') {
        console.warn(`START_EXTRACT action called in invalid state: ${state.status}`);
        return state;
      }
      const initialProgress: Progress = {
        current: 0,
        total: action.payload.totalFrames,
        percent: 0,
        estimatedTime: 0,
      };
      return {
        status: 'extracting',
        video: state.video,
        config: state.config,
        progress: initialProgress,
        videoFile: state.videoFile,
      };
    }

    case ActionType.UPDATE_PROGRESS: {
      // 更新提取进度
      if (state.status !== 'extracting') {
        console.warn(`UPDATE_PROGRESS action called in invalid state: ${state.status}`);
        return state;
      }
      return {
        ...state,
        progress: action.payload.progress,
      };
    }

    case ActionType.COMPLETE: {
      // 提取完成
      if (state.status !== 'extracting') {
        console.warn(`COMPLETE action called in invalid state: ${state.status}`);
        return state;
      }
      return {
        status: 'completed',
        video: state.video,
        frames: action.payload.frames,
      };
    }

    case ActionType.ERROR: {
      // 发生错误，进入错误状态
      return {
        status: 'error',
        error: action.payload.error,
      };
    }

    case ActionType.RESET: {
      // 重置到初始状态
      return INITIAL_STATE;
    }

    case ActionType.DELETE_FRAMES: {
      // 删除指定的帧
      if (state.status !== 'completed') {
        console.warn(`DELETE_FRAMES action called in invalid state: ${state.status}`);
        return state;
      }
      const frameIdsToDelete = new Set(action.payload.frameIds);
      const remainingFrames = state.frames.filter(
        (frame) => !frameIdsToDelete.has(frame.id)
      );
      // 如果没有帧剩余，返回到配置状态
      if (remainingFrames.length === 0) {
        return {
          status: 'configuring',
          video: state.video,
          config: DEFAULT_EXTRACT_CONFIG,
        };
      }
      return {
        ...state,
        frames: remainingFrames,
      };
    }

    default: {
      // TypeScript 穷尽检查
      const _exhaustiveCheck: never = action;
      return _exhaustiveCheck;
    }
  }
}

/**
 * 状态类型守卫函数
 */

/** 检查是否为 idle 状态 */
export const isIdle = (state: AppState): state is { status: 'idle' } =>
  state.status === 'idle';

/** 检查是否为 ffmpeg_loading 状态 */
export const isFFmpegLoading = (
  state: AppState
): state is { status: 'ffmpeg_loading'; progress: number } =>
  state.status === 'ffmpeg_loading';

/** 检查是否为 video_loading 状态 */
export const isVideoLoading = (
  state: AppState
): state is { status: 'video_loading'; progress: number; videoFile?: File } =>
  state.status === 'video_loading';

/** 检查是否为 configuring 状态 */
export const isConfiguring = (
  state: AppState
): state is { status: 'configuring'; video: AppState extends { status: 'configuring' } ? AppState['video'] : never; config: ExtractConfig } =>
  state.status === 'configuring';

/** 检查是否为 extracting 状态 */
export const isExtracting = (
  state: AppState
): state is { status: 'extracting'; video: AppState extends { status: 'extracting' } ? AppState['video'] : never; config: ExtractConfig; progress: Progress } =>
  state.status === 'extracting';

/** 检查是否为 completed 状态 */
export const isCompleted = (
  state: AppState
): state is { status: 'completed'; video: AppState extends { status: 'completed' } ? AppState['video'] : never; frames: AppState extends { status: 'completed' } ? AppState['frames'] : never } =>
  state.status === 'completed';

/** 检查是否为 error 状态 */
export const isError = (
  state: AppState
): state is { status: 'error'; error: AppState extends { status: 'error' } ? AppState['error'] : never } =>
  state.status === 'error';
