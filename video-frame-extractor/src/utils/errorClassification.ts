/**
 * 错误分类工具
 * 提供错误分类、消息获取和恢复策略判断
 */

import type { ErrorCode } from '@/types/worker';

/**
 * 错误信息配置
 */
interface ErrorConfig {
  /** 用户友好的错误消息 */
  message: string;
  /** 是否可恢复 */
  recoverable: boolean;
  /** 恢复操作建议 */
  recoveryAction: string;
  /** 严重程度 */
  severity: 'low' | 'medium' | 'high' | 'critical';
}

/**
 * 错误配置映射表
 */
const ERROR_CONFIGS: Record<ErrorCode, ErrorConfig> = {
  MEMORY_EXCEEDED: {
    message: '内存不足，无法处理当前视频',
    recoverable: true,
    recoveryAction: '降低输出质量或分辨率后重试',
    severity: 'high',
  },
  FFMPEG_LOAD_FAILED: {
    message: 'FFmpeg 加载失败',
    recoverable: true,
    recoveryAction: '切换 CDN 源并重试',
    severity: 'high',
  },
  VIDEO_DECODE_ERROR: {
    message: '视频解码失败，文件可能已损坏',
    recoverable: false,
    recoveryAction: '请尝试其他视频文件',
    severity: 'medium',
  },
  UNSUPPORTED_FORMAT: {
    message: '不支持的视频格式',
    recoverable: false,
    recoveryAction: '请使用 MP4、WebM 或 MOV 格式的视频',
    severity: 'medium',
  },
  UNKNOWN_ERROR: {
    message: '发生未知错误',
    recoverable: false,
    recoveryAction: '请刷新页面重试',
    severity: 'critical',
  },
};

/**
 * 扩展的错误代码，包含更多应用级错误
 */
export type ExtendedErrorCode = ErrorCode 
  | 'FILE_TOO_LARGE'
  | 'NETWORK_ERROR'
  | 'PERMISSION_DENIED'
  | 'INVALID_CONFIG'
  | 'OPERATION_CANCELLED'
  | 'BROWSER_NOT_SUPPORTED';

/**
 * 扩展错误配置
 */
const EXTENDED_ERROR_CONFIGS: Record<ExtendedErrorCode, ErrorConfig> = {
  ...ERROR_CONFIGS,
  FILE_TOO_LARGE: {
    message: '文件过大，超出处理限制',
    recoverable: true,
    recoveryAction: '请选择较小的视频文件',
    severity: 'medium',
  },
  NETWORK_ERROR: {
    message: '网络连接失败',
    recoverable: true,
    recoveryAction: '请检查网络连接后重试',
    severity: 'medium',
  },
  PERMISSION_DENIED: {
    message: '权限被拒绝',
    recoverable: false,
    recoveryAction: '请授予必要的权限',
    severity: 'high',
  },
  INVALID_CONFIG: {
    message: '配置参数无效',
    recoverable: true,
    recoveryAction: '请检查配置参数',
    severity: 'low',
  },
  OPERATION_CANCELLED: {
    message: '操作已取消',
    recoverable: true,
    recoveryAction: '可以重新开始操作',
    severity: 'low',
  },
  BROWSER_NOT_SUPPORTED: {
    message: '浏览器不支持此功能',
    recoverable: false,
    recoveryAction: '请使用现代浏览器（Chrome、Firefox、Edge）',
    severity: 'critical',
  },
};

/**
 * 错误分类结果
 */
export interface ClassifiedError {
  code: ExtendedErrorCode;
  message: string;
  recoverable: boolean;
  recoveryAction: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  originalError?: Error;
}

/**
 * 错误关键词映射
 */
const ERROR_KEYWORD_MAP: Array<{
  keywords: string[];
  code: ExtendedErrorCode;
}> = [
  { keywords: ['memory', 'out of memory', 'heap'], code: 'MEMORY_EXCEEDED' },
  { keywords: ['ffmpeg', 'load', 'wasm', 'core'], code: 'FFMPEG_LOAD_FAILED' },
  { keywords: ['decode', 'codec', 'stream'], code: 'VIDEO_DECODE_ERROR' },
  { keywords: ['format', 'container', 'mime'], code: 'UNSUPPORTED_FORMAT' },
  { keywords: ['network', 'fetch', 'cdn', 'download'], code: 'NETWORK_ERROR' },
  { keywords: ['permission', 'denied', 'access'], code: 'PERMISSION_DENIED' },
  { keywords: ['large', 'size', 'big'], code: 'FILE_TOO_LARGE' },
  { keywords: ['cancel', 'abort'], code: 'OPERATION_CANCELLED' },
  { keywords: ['sharedarraybuffer', 'cross-origin', 'secure'], code: 'BROWSER_NOT_SUPPORTED' },
];

/**
 * 分类错误
 * @param error 原始错误对象
 * @returns 分类后的错误信息
 */
export function classifyError(error: unknown): ClassifiedError {
  // 如果错误已经是已知错误代码格式
  if (isKnownErrorCode(error)) {
    const code = error.code as ExtendedErrorCode;
    const config = EXTENDED_ERROR_CONFIGS[code] || EXTENDED_ERROR_CONFIGS.UNKNOWN_ERROR;
    // 确保 error 有 name 属性
    if (!('name' in error)) {
      Object.defineProperty(error, 'name', {
        value: 'Error',
        writable: true,
        enumerable: false,
        configurable: true,
      });
    }
    return {
      code,
      ...config,
      originalError: error as unknown as Error,
    };
  }

  // 如果是 Error 对象
  if (error instanceof Error) {
    const errorMessage = error.message.toLowerCase();
    
    // 根据关键词匹配错误类型
    for (const { keywords, code } of ERROR_KEYWORD_MAP) {
      if (keywords.some(keyword => errorMessage.includes(keyword))) {
        const config = EXTENDED_ERROR_CONFIGS[code];
        return {
          code,
          ...config,
          originalError: error,
        };
      }
    }

    // 检查错误名称
    if (error.name === 'NetworkError') {
      return {
        code: 'NETWORK_ERROR',
        ...EXTENDED_ERROR_CONFIGS.NETWORK_ERROR,
        originalError: error,
      };
    }

    if (error.name === 'NotAllowedError' || error.name === 'PermissionDeniedError') {
      return {
        code: 'PERMISSION_DENIED',
        ...EXTENDED_ERROR_CONFIGS.PERMISSION_DENIED,
        originalError: error,
      };
    }

    if (error.name === 'AbortError') {
      return {
        code: 'OPERATION_CANCELLED',
        ...EXTENDED_ERROR_CONFIGS.OPERATION_CANCELLED,
        originalError: error,
      };
    }

    // 未知错误
    return {
      code: 'UNKNOWN_ERROR',
      ...EXTENDED_ERROR_CONFIGS.UNKNOWN_ERROR,
      originalError: error,
    };
  }

  // 字符串错误
  if (typeof error === 'string') {
    const errorMessage = error.toLowerCase();
    
    for (const { keywords, code } of ERROR_KEYWORD_MAP) {
      if (keywords.some(keyword => errorMessage.includes(keyword))) {
        const config = EXTENDED_ERROR_CONFIGS[code];
        return {
          code,
          ...config,
          originalError: new Error(error),
        };
      }
    }
  }

  // 完全未知的错误
  return {
    code: 'UNKNOWN_ERROR',
    ...EXTENDED_ERROR_CONFIGS.UNKNOWN_ERROR,
    originalError: error instanceof Error ? error : new Error(String(error)),
  };
}

/**
 * 检查是否为已知错误代码格式
 */
function isKnownErrorCode(error: unknown): error is { code: string; message?: string } {
  return (
    typeof error === 'object' &&
    error !== null &&
    'code' in error &&
    typeof (error as { code: unknown }).code === 'string' &&
    (error as { code: string }).code in EXTENDED_ERROR_CONFIGS
  );
}

/**
 * 获取用户友好的错误消息
 * @param code 错误代码
 * @returns 用户友好的错误消息
 */
export function getErrorMessage(code: ExtendedErrorCode): string {
  return EXTENDED_ERROR_CONFIGS[code]?.message || '发生未知错误';
}

/**
 * 检查错误是否可恢复
 * @param code 错误代码
 * @returns 是否可恢复
 */
export function isRecoverable(code: ExtendedErrorCode): boolean {
  return EXTENDED_ERROR_CONFIGS[code]?.recoverable ?? false;
}

/**
 * 获取恢复操作建议
 * @param code 错误代码
 * @returns 恢复操作建议
 */
export function getRecoveryAction(code: ExtendedErrorCode): string {
  return EXTENDED_ERROR_CONFIGS[code]?.recoveryAction || '请刷新页面重试';
}

/**
 * 获取错误严重程度
 * @param code 错误代码
 * @returns 严重程度
 */
export function getErrorSeverity(code: ExtendedErrorCode): 'low' | 'medium' | 'high' | 'critical' {
  return EXTENDED_ERROR_CONFIGS[code]?.severity || 'medium';
}

/**
 * 创建标准化的应用错误对象
 * @param error 原始错误
 * @returns 标准化的错误对象
 */
export function createAppError(error: unknown): {
  code: string;
  message: string;
  recoverable: boolean;
} {
  const classified = classifyError(error);
  const result = {
    code: classified.code,
    message: classified.message,
    recoverable: classified.recoverable,
  };
  
  // 确保 originalError 有 name 属性
  if (classified.originalError && !('name' in classified.originalError)) {
    Object.defineProperty(classified.originalError, 'name', {
      value: 'Error',
      writable: true,
      enumerable: false,
      configurable: true,
    });
  }
  
  return result;
}

/**
 * 格式化错误用于日志记录
 * @param error 分类后的错误
 * @returns 格式化的错误字符串
 */
export function formatErrorForLog(error: ClassifiedError): string {
  const timestamp = new Date().toISOString();
  const details = error.originalError?.stack || error.originalError?.message || '';
  return `[${timestamp}] [${error.code}] ${error.message}\n${details}`;
}

/**
 * 判断是否需要报告错误（用于错误监控）
 * @param error 分类后的错误
 * @returns 是否需要报告
 */
export function shouldReportError(error: ClassifiedError): boolean {
  // 严重程度为 high 或 critical 的错误需要报告
  return error.severity === 'high' || error.severity === 'critical';
}
