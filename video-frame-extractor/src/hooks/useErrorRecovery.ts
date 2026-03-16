/**
 * 错误恢复 Hook
 * 提供错误处理和自动恢复功能
 */

import { useCallback, useRef } from 'react';
import { useToast } from '@/components/toast';
import { useAppActions } from '@/context/AppContext';
import { recoveryService } from '@/services/recoveryService';
import { classifyError, type ExtendedErrorCode } from '@/utils/errorClassification';
import type { ExtractConfig, AppError } from '@/types/state';

/**
 * 错误恢复选项
 */
export interface ErrorRecoveryOptions {
  /** 是否显示 Toast 通知 */
  showToast?: boolean;
  /** 是否自动重试 */
  autoRetry?: boolean;
  /** 自定义错误处理 */
  onError?: (error: unknown) => void;
  /** 恢复成功回调 */
  onRecovery?: (newConfig?: Partial<ExtractConfig>) => void;
  /** 恢复失败回调 */
  onRecoveryFailed?: (error: unknown) => void;
}

/**
 * 错误恢复 Hook 返回值
 */
export interface UseErrorRecoveryReturn {
  /** 处理错误 */
  handleError: (error: unknown, options?: ErrorRecoveryOptions) => Promise<boolean>;
  /** 重置错误状态 */
  resetError: () => void;
  /** 手动触发恢复 */
  triggerRecovery: (errorCode: ExtendedErrorCode) => Promise<boolean>;
  /** 检查是否可自动恢复 */
  canAutoRecover: (error: unknown) => boolean;
  /** 获取恢复建议 */
  getRecoverySuggestion: (error: unknown) => string;
}

/**
 * 错误恢复 Hook
 * 
 * @example
 * ```tsx
 * function MyComponent() {
 *   const { handleError, canAutoRecover } = useErrorRecovery();
 *   
 *   const handleExtract = async () => {
 *     try {
 *       await extractFrames();
 *     } catch (error) {
 *       const recovered = await handleError(error, {
 *         autoRetry: true,
 *         onRecovery: (newConfig) => {
 *           console.log('Recovered with config:', newConfig);
 *         }
 *       });
 *       
 *       if (!recovered) {
 *         // 手动处理错误
 *       }
 *     }
 *   };
 * }
 * ```
 */
export function useErrorRecovery(): UseErrorRecoveryReturn {
  const toast = useToast();
  const actions = useAppActions();
  const isRecoveringRef = useRef(false);

  /**
   * 处理错误
   */
  const handleError = useCallback(
    async (error: unknown, options?: ErrorRecoveryOptions): Promise<boolean> => {
      const {
        showToast = true,
        autoRetry = true,
        onError,
        onRecovery,
        onRecoveryFailed,
      } = options || {};

      // 分类错误
      const classifiedError = classifyError(error);

      // 调用自定义错误处理
      onError?.(error);

      // 记录错误到控制台
      console.error('[ErrorRecovery]', classifiedError);

      // 设置应用错误状态
      const appError: AppError = {
        code: classifiedError.code,
        message: classifiedError.message,
        recoverable: classifiedError.recoverable,
      };
      actions.setError(appError);

      // 显示 Toast 通知
      if (showToast) {
        const canRecover = recoveryService.canAutoRecover(error);
        const suggestion = recoveryService.getRecoverySuggestion(error);

        toast.error(classifiedError.message, {
          description: suggestion,
          duration: canRecover ? 4000 : 6000,
          action: canRecover ? {
            label: '重试',
            onClick: () => triggerRecovery(classifiedError.code),
          } : undefined,
        });
      }

      // 尝试自动恢复
      if (autoRetry && recoveryService.canAutoRecover(error)) {
        const result = await recoveryService.executeRecovery(error);

        if (result.success) {
          // 显示恢复中的提示
          if (showToast) {
            toast.info('正在恢复...', { description: result.message });
          }

          // 调用恢复成功回调
          onRecovery?.(result.newConfig);

          return true;
        } else {
          // 恢复失败
          if (showToast) {
            toast.error('恢复失败', { description: result.message });
          }

          // 调用恢复失败回调
          onRecoveryFailed?.(error);

          return false;
        }
      }

      return false;
    },
    [toast, actions]
  );

  /**
   * 重置错误状态
   */
  const resetError = useCallback(() => {
    actions.reset();
    recoveryService.resetRetryCount();
    recoveryService.resetCDNIndex();
    isRecoveringRef.current = false;
  }, [actions]);

  /**
   * 手动触发恢复
   */
  const triggerRecovery = useCallback(
    async (errorCode: ExtendedErrorCode): Promise<boolean> => {
      if (isRecoveringRef.current) {
        return false;
      }

      isRecoveringRef.current = true;

      try {
        const result = await recoveryService.executeRecovery({ code: errorCode } as any);

        if (result.success) {
          toast.success('恢复成功', { description: result.message });
          return true;
        } else {
          toast.error('恢复失败', { description: result.message });
          return false;
        }
      } finally {
        isRecoveringRef.current = false;
      }
    },
    [toast]
  );

  /**
   * 检查是否可自动恢复
   */
  const canAutoRecover = useCallback((error: unknown): boolean => {
    return recoveryService.canAutoRecover(error);
  }, []);

  /**
   * 获取恢复建议
   */
  const getRecoverySuggestion = useCallback((error: unknown): string => {
    return recoveryService.getRecoverySuggestion(error);
  }, []);

  return {
    handleError,
    resetError,
    triggerRecovery,
    canAutoRecover,
    getRecoverySuggestion,
  };
}

export default useErrorRecovery;
