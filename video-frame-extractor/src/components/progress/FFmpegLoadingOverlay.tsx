/**
 * Video Frame Extractor - FFmpegLoadingOverlay Component
 * FFmpeg 加载全屏遮罩组件
 */

import { useAppState } from '../../context';
import { CircularProgress } from '../ui';

/**
 * FFmpeg 加载遮罩组件
 * 在 FFmpeg 首次加载时显示全屏遮罩
 */
export function FFmpegLoadingOverlay() {
  const state = useAppState();

  // 只在 ffmpeg_loading 状态下显示
  if (state.status !== 'ffmpeg_loading') {
    return null;
  }

  const { progress } = state;

  return (
    <div
      className="
        fixed inset-0 z-50
        flex items-center justify-center
        bg-white/80 dark:bg-gray-950/80
        backdrop-blur-sm
      "
      role="dialog"
      aria-modal="true"
      aria-labelledby="ffmpeg-loading-title"
    >
      <div
        className="
          flex flex-col items-center
          p-8 rounded-2xl
          bg-white dark:bg-gray-900
          shadow-2xl
          max-w-sm w-full mx-4
        "
      >
        {/* 进度环 */}
        <div className="mb-6">
          <CircularProgress
            value={progress}
            max={100}
            size={80}
            strokeWidth={6}
            showLabel
            variant="default"
          />
        </div>

        {/* 加载标题 */}
        <h2
          id="ffmpeg-loading-title"
          className="text-xl font-semibold text-gray-900 dark:text-gray-100 mb-2"
        >
          正在加载视频处理引擎
        </h2>

        {/* 加载消息 */}
        <p className="text-sm text-gray-500 dark:text-gray-400 text-center mb-4">
          FFmpeg 正在初始化，请稍候...
        </p>

        {/* 首次加载提示 */}
        <div
          className="
            flex items-start gap-2
            p-3 rounded-lg
            bg-blue-50 dark:bg-blue-900/20
            text-blue-700 dark:text-blue-300
          "
        >
          <svg
            className="w-5 h-5 flex-shrink-0 mt-0.5"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
            />
          </svg>
          <p className="text-xs">
            首次加载可能需要较长时间（约 10-30 秒），
            加载完成后将自动缓存，后续使用将更快。
          </p>
        </div>
      </div>
    </div>
  );
}

export default FFmpegLoadingOverlay;
