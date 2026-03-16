/**
 * ErrorBoundary 组件
 * 捕获 React 渲染错误并显示备用 UI
 */

import { Component, type ReactNode, type ErrorInfo } from 'react';
import { Button } from '../ui/Button';

/**
 * ErrorBoundary 组件属性
 */
export interface ErrorBoundaryProps {
  /** 子组件 */
  children: ReactNode;
  /** 自定义错误回退 UI */
  fallback?: ReactNode;
  /** 错误回调 */
  onError?: (error: Error, errorInfo: ErrorInfo) => void;
  /** 重试回调 */
  onRetry?: () => void;
  /** 重置回调（完全重置状态） */
  onReset?: () => void;
}

/**
 * ErrorBoundary 组件状态
 */
interface ErrorBoundaryState {
  /** 是否有错误 */
  hasError: boolean;
  /** 错误对象 */
  error: Error | null;
  /** 错误信息 */
  errorInfo: ErrorInfo | null;
  /** 错误 ID（用于报告） */
  errorId: string | null;
}

/**
 * ErrorBoundary 组件
 * 
 * @example
 * ```tsx
 * <ErrorBoundary
 *   onError={(error, errorInfo) => console.error(error, errorInfo)}
 *   onRetry={() => window.location.reload()}
 * >
 *   <App />
 * </ErrorBoundary>
 * ```
 */
export class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
      errorId: null,
    };
  }

  /**
   * 从错误中派生状态
   */
  static getDerivedStateFromError(error: Error): Partial<ErrorBoundaryState> {
    return {
      hasError: true,
      error,
      errorId: `error-${Date.now()}`,
    };
  }

  /**
   * 捕获错误信息
   */
  componentDidCatch(error: Error, errorInfo: ErrorInfo): void {
    this.setState({ errorInfo });
    
    // 调用错误回调
    this.props.onError?.(error, errorInfo);

    // 记录错误到控制台
    console.error('[ErrorBoundary] Caught an error:', error);
    console.error('[ErrorBoundary] Component stack:', errorInfo.componentStack);
  }

  /**
   * 处理重试
   */
  handleRetry = (): void => {
    const { onRetry } = this.props;
    
    // 重置错误状态
    this.setState({
      hasError: false,
      error: null,
      errorInfo: null,
      errorId: null,
    });

    // 调用重试回调
    onRetry?.();
  };

  /**
   * 处理重置
   */
  handleReset = (): void => {
    const { onReset } = this.props;
    
    // 重置错误状态
    this.setState({
      hasError: false,
      error: null,
      errorInfo: null,
      errorId: null,
    });

    // 调用重置回调
    onReset?.();
  };

  /**
   * 复制错误详情
   */
  handleCopyError = (): void => {
    const { error, errorInfo, errorId } = this.state;
    
    const errorDetails = `
错误 ID: ${errorId}
错误消息: ${error?.message}
错误堆栈: ${error?.stack}
组件堆栈: ${errorInfo?.componentStack}
时间: ${new Date().toISOString()}
    `.trim();

    navigator.clipboard.writeText(errorDetails).then(() => {
      alert('错误详情已复制到剪贴板');
    }).catch(() => {
      // 降级方案
      const textarea = document.createElement('textarea');
      textarea.value = errorDetails;
      document.body.appendChild(textarea);
      textarea.select();
      document.execCommand('copy');
      document.body.removeChild(textarea);
      alert('错误详情已复制到剪贴板');
    });
  };

  render(): ReactNode {
    const { hasError, error, errorInfo, errorId } = this.state;
    const { children, fallback } = this.props;

    if (hasError) {
      // 如果提供了自定义 fallback，使用它
      if (fallback) {
        return fallback;
      }

      // 默认错误 UI
      return (
        <div
          className="
            min-h-[400px]
            flex flex-col items-center justify-center
            p-8
            bg-red-50 dark:bg-red-950/50
            rounded-xl
            border border-red-200 dark:border-red-800
          "
        >
          {/* 错误图标 */}
          <div
            className="
              w-16 h-16 mb-6
              flex items-center justify-center
              rounded-full
              bg-red-100 dark:bg-red-900/50
            "
          >
            <svg
              className="w-8 h-8 text-red-500 dark:text-red-400"
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
          </div>

          {/* 错误标题 */}
          <h2
            className="
              text-xl font-semibold
              text-red-800 dark:text-red-200
              mb-2
            "
          >
            出错了
          </h2>

          {/* 错误消息 */}
          <p
            className="
              text-sm text-center
              text-red-600 dark:text-red-300
              mb-6 max-w-md
            "
          >
            {error?.message || '应用程序遇到了一个意外错误'}
          </p>

          {/* 错误 ID */}
          {errorId && (
            <p className="text-xs text-red-500 dark:text-red-400 mb-4">
              错误 ID: {errorId}
            </p>
          )}

          {/* 操作按钮 */}
          <div className="flex gap-3">
            <Button
              variant="primary"
              onClick={this.handleRetry}
              leftIcon={
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
                  />
                </svg>
              }
            >
              重试
            </Button>

            <Button
              variant="secondary"
              onClick={this.handleReset}
            >
              重置
            </Button>

            <Button
              variant="ghost"
              onClick={this.handleCopyError}
              leftIcon={
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z"
                  />
                </svg>
              }
            >
              复制错误详情
            </Button>
          </div>

          {/* 开发环境显示详细错误 */}
          {process.env.NODE_ENV === 'development' && errorInfo?.componentStack && (
            <details className="mt-6 w-full max-w-lg">
              <summary className="cursor-pointer text-sm text-red-600 dark:text-red-400 hover:underline">
                查看组件堆栈
              </summary>
              <pre
                className="
                  mt-2 p-4
                  text-xs overflow-auto
                  bg-red-100 dark:bg-red-900/30
                  rounded-lg
                  text-red-800 dark:text-red-200
                "
              >
                {errorInfo.componentStack}
              </pre>
            </details>
          )}
        </div>
      );
    }

    return children;
  }
}

export default ErrorBoundary;
