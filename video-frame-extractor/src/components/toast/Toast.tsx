/**
 * Toast 组件
 * 单个 Toast 通知组件
 */

import { useEffect, useCallback, useState } from 'react';
import type { ReactNode } from 'react';
import type { ToastConfig, ToastType } from './ToastContext';

const TOAST_ICONS: Record<ToastType, ReactNode> = {
  success: (
    <svg
      className="w-5 h-5"
      fill="none"
      viewBox="0 0 24 24"
      stroke="currentColor"
      strokeWidth={2}
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M5 13l4 4L19 7"
      />
    </svg>
  ),
  error: (
    <svg
      className="w-5 h-5"
      fill="none"
      viewBox="0 0 24 24"
      stroke="currentColor"
      strokeWidth={2}
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M6 18L18 6M6 6l12 12"
      />
    </svg>
  ),
  warning: (
    <svg
      className="w-5 h-5"
      fill="none"
      viewBox="0 0 24 24"
      stroke="currentColor"
      strokeWidth={2}
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
      />
    </svg>
  ),
  info: (
    <svg
      className="w-5 h-5"
      fill="none"
      viewBox="0 0 24 24"
      stroke="currentColor"
      strokeWidth={2}
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
      />
    </svg>
  ),
};

export interface ToastProps {
  toast: ToastConfig;
  onClose: (id: string) => void;
}

/**
 * Toast 样式配置
 */
const TOAST_STYLES: Record<ToastType, { container: string; icon: string }> = {
  success: {
    container: `
      bg-green-50 dark:bg-green-950
      border-green-200 dark:border-green-800
      text-green-800 dark:text-green-100
    `,
    icon: 'text-green-500 dark:text-green-400',
  },
  error: {
    container: `
      bg-red-50 dark:bg-red-950
      border-red-200 dark:border-red-800
      text-red-800 dark:text-red-100
    `,
    icon: 'text-red-500 dark:text-red-400',
  },
  warning: {
    container: `
      bg-yellow-50 dark:bg-yellow-950
      border-yellow-200 dark:border-yellow-800
      text-yellow-800 dark:text-yellow-100
    `,
    icon: 'text-yellow-500 dark:text-yellow-400',
  },
  info: {
    container: `
      bg-blue-50 dark:bg-blue-950
      border-blue-200 dark:border-blue-800
      text-blue-800 dark:text-blue-100
    `,
    icon: 'text-blue-500 dark:text-blue-400',
  },
};

/**
 * Toast 组件
 */
export function Toast({ toast, onClose }: ToastProps) {
  const [isExiting, setIsExiting] = useState(false);
  const styles = TOAST_STYLES[toast.type];

  /**
   * 处理关闭
   */
  const handleClose = useCallback(() => {
    setIsExiting(true);
    setTimeout(() => {
      onClose(toast.id);
      toast.onClose?.();
    }, 200); // 动画时长
  }, [onClose, toast]);

  /**
   * 自动关闭
   */
  useEffect(() => {
    if (toast.duration && toast.duration > 0) {
      const timer = setTimeout(handleClose, toast.duration);
      return () => clearTimeout(timer);
    }
  }, [toast.duration, handleClose]);

  return (
    <div
      role="alert"
      aria-live="polite"
      className={`
        flex items-start gap-3
        p-4 rounded-lg border shadow-lg
        transition-all duration-200 ease-out
        ${styles.container}
        ${isExiting ? 'opacity-0 translate-x-4' : 'opacity-100 translate-x-0'}
      `.replace(/\s+/g, ' ').trim()}
    >
      {/* 图标 */}
      <div className={`flex-shrink-0 ${styles.icon}`}>
        {TOAST_ICONS[toast.type]}
      </div>

      {/* 内容 */}
      <div className="flex-1 min-w-0">
        <p className="font-medium text-sm">{toast.title}</p>
        {toast.description && (
          <p className="mt-1 text-sm opacity-90">{toast.description}</p>
        )}
        {toast.action && (
          <button
            onClick={toast.action.onClick}
            className={`
              mt-2 text-sm font-medium
              underline underline-offset-2
              hover:opacity-80
              transition-opacity
            `.replace(/\s+/g, ' ').trim()}
          >
            {toast.action.label}
          </button>
        )}
      </div>

      {/* 关闭按钮 */}
      {toast.closable && (
        <button
          onClick={handleClose}
          className={`
            flex-shrink-0 p-1 rounded
            hover:bg-black/10 dark:hover:bg-white/10
            transition-colors
            opacity-60 hover:opacity-100
          `.replace(/\s+/g, ' ').trim()}
          aria-label="关闭"
        >
          <svg
            className="w-4 h-4"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={2}
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M6 18L18 6M6 6l12 12"
            />
          </svg>
        </button>
      )}
    </div>
  );
}

export default Toast;
