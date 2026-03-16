/**
 * useToast Hook
 * 提供便捷的 Toast 通知功能
 */

import { useCallback } from 'react';
import { useToastContext, type ToastType, type ToastConfig } from './ToastContext';

/**
 * Toast 选项
 */
export interface ToastOptions {
  /** 描述信息 */
  description?: string;
  /** 持续时间（毫秒） */
  duration?: number;
  /** 是否显示关闭按钮 */
  closable?: boolean;
  /** 关闭回调 */
  onClose?: () => void;
  /** 操作按钮 */
  action?: {
    label: string;
    onClick: () => void;
  };
}

/**
 * useToast Hook 返回值
 */
export interface UseToastReturn {
  /** 显示 Toast */
  show: (type: ToastType, title: string, options?: ToastOptions) => string;
  /** 显示成功 Toast */
  success: (title: string, options?: ToastOptions) => string;
  /** 显示错误 Toast */
  error: (title: string, options?: ToastOptions) => string;
  /** 显示警告 Toast */
  warning: (title: string, options?: ToastOptions) => string;
  /** 显示信息 Toast */
  info: (title: string, options?: ToastOptions) => string;
  /** 关闭指定 Toast */
  dismiss: (id: string) => void;
  /** 关闭所有 Toast */
  dismissAll: () => void;
  /** 更新 Toast */
  update: (id: string, options: Partial<ToastConfig>) => void;
}

/**
 * useToast Hook
 * 
 * @example
 * ```tsx
 * function MyComponent() {
 *   const toast = useToast();
 *   
 *   const handleSuccess = () => {
 *     toast.success('操作成功', { description: '数据已保存' });
 *   };
 *   
 *   const handleError = () => {
 *     toast.error('操作失败', {
 *       description: '请稍后重试',
 *       action: { label: '重试', onClick: handleRetry }
 *     });
 *   };
 *   
 *   return (
 *     <>
 *       <button onClick={handleSuccess}>成功</button>
 *       <button onClick={handleError}>失败</button>
 *     </>
 *   );
 * }
 * ```
 */
export function useToast(): UseToastReturn {
  const context = useToastContext();

  /**
   * 显示 Toast
   */
  const show = useCallback(
    (type: ToastType, title: string, options?: ToastOptions): string => {
      return context.addToast({
        type,
        title,
        ...options,
      });
    },
    [context]
  );

  /**
   * 显示成功 Toast
   */
  const success = useCallback(
    (title: string, options?: ToastOptions): string => {
      return show('success', title, options);
    },
    [show]
  );

  /**
   * 显示错误 Toast
   */
  const error = useCallback(
    (title: string, options?: ToastOptions): string => {
      return show('error', title, options);
    },
    [show]
  );

  /**
   * 显示警告 Toast
   */
  const warning = useCallback(
    (title: string, options?: ToastOptions): string => {
      return show('warning', title, options);
    },
    [show]
  );

  /**
   * 显示信息 Toast
   */
  const info = useCallback(
    (title: string, options?: ToastOptions): string => {
      return show('info', title, options);
    },
    [show]
  );

  /**
   * 关闭指定 Toast
   */
  const dismiss = useCallback(
    (id: string) => {
      context.removeToast(id);
    },
    [context]
  );

  /**
   * 关闭所有 Toast
   */
  const dismissAll = useCallback(() => {
    context.removeAllToasts();
  }, [context]);

  /**
   * 更新 Toast
   */
  const update = useCallback(
    (id: string, options: Partial<ToastConfig>) => {
      context.updateToast(id, options);
    },
    [context]
  );

  return {
    show,
    success,
    error,
    warning,
    info,
    dismiss,
    dismissAll,
    update,
  };
}

export default useToast;
