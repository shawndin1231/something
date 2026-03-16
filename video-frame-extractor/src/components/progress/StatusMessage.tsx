/**
 * Video Frame Extractor - StatusMessage Component
 * 状态消息显示组件
 */

import { useAppState } from '../../context';
import type { AppState } from '../../types/state';

/**
 * 状态类型
 */
type StatusType = 'loading' | 'error' | 'success' | 'info' | 'warning';

/**
 * 状态图标组件
 */
function StatusIcon({ type }: { type: StatusType }) {
  const iconClass = 'w-5 h-5';

  switch (type) {
    case 'loading':
      return (
        <svg
          className={`${iconClass} animate-spin`}
          fill="none"
          viewBox="0 0 24 24"
        >
          <circle
            className="opacity-25"
            cx="12"
            cy="12"
            r="10"
            stroke="currentColor"
            strokeWidth="4"
          />
          <path
            className="opacity-75"
            fill="currentColor"
            d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
          />
        </svg>
      );

    case 'error':
      return (
        <svg className={iconClass} fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
          />
        </svg>
      );

    case 'success':
      return (
        <svg className={iconClass} fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
          />
        </svg>
      );

    case 'warning':
      return (
        <svg className={iconClass} fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
          />
        </svg>
      );

    case 'info':
    default:
      return (
        <svg className={iconClass} fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
          />
        </svg>
      );
  }
}

/**
 * 状态样式映射
 */
const statusStyles: Record<StatusType, string> = {
  loading: `
    bg-blue-50 dark:bg-blue-900/20
    text-blue-700 dark:text-blue-300
    border border-blue-200 dark:border-blue-800
  `,
  error: `
    bg-red-50 dark:bg-red-900/20
    text-red-700 dark:text-red-300
    border border-red-200 dark:border-red-800
  `,
  success: `
    bg-green-50 dark:bg-green-900/20
    text-green-700 dark:text-green-300
    border border-green-200 dark:border-green-800
  `,
  warning: `
    bg-yellow-50 dark:bg-yellow-900/20
    text-yellow-700 dark:text-yellow-300
    border border-yellow-200 dark:border-yellow-800
  `,
  info: `
    bg-gray-50 dark:bg-gray-800
    text-gray-700 dark:text-gray-300
    border border-gray-200 dark:border-gray-700
  `,
};

/**
 * 获取状态消息和类型
 */
function getStatusMessage(state: AppState): {
  message: string;
  type: StatusType;
} | null {
  switch (state.status) {
    case 'idle':
      return {
        message: '请上传视频文件开始提取',
        type: 'info',
      };

    case 'ffmpeg_loading':
      return {
        message: '正在加载视频处理引擎...',
        type: 'loading',
      };

    case 'video_loading':
      return {
        message: `正在加载视频文件... ${Math.round(state.progress)}%`,
        type: 'loading',
      };

    case 'configuring':
      return {
        message: '请配置提取参数',
        type: 'info',
      };

    case 'extracting':
      return {
        message: `正在提取视频帧... ${Math.round(state.progress.percent)}%`,
        type: 'loading',
      };

    case 'completed':
      return {
        message: `提取完成! 共提取 ${state.frames.length} 帧`,
        type: 'success',
      };

    case 'error':
      return {
        message: state.error.message,
        type: 'error',
      };

    default:
      return null;
  }
}

/**
 * 状态消息组件
 * 显示当前应用状态的文字提示
 */
export function StatusMessage() {
  const state = useAppState();

  const statusInfo = getStatusMessage(state);

  if (!statusInfo) {
    return null;
  }

  const { message, type } = statusInfo;

  return (
    <div
      className={`
        flex items-center gap-3
        px-4 py-3 rounded-lg
        ${statusStyles[type]}
      `.replace(/\s+/g, ' ').trim()}
      role={type === 'error' ? 'alert' : 'status'}
    >
      <StatusIcon type={type} />
      <span className="text-sm font-medium">{message}</span>
    </div>
  );
}

export default StatusMessage;
