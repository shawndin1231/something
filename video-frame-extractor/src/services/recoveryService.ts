/**
 * 恢复策略服务
 * 提供错误恢复策略和自动重试机制
 */

import type { ExtendedErrorCode, ClassifiedError } from '@/utils/errorClassification';
import { classifyError, getRecoveryAction } from '@/utils/errorClassification';
import type { ExtractConfig } from '@/types/state';

/**
 * 恢复策略类型
 */
export type RecoveryStrategy = 
  | 'reduce_quality'
  | 'switch_cdn'
  | 'show_message'
  | 'refresh_page'
  | 'manual_intervention';

/**
 * 恢复策略配置
 */
export interface RecoveryConfig {
  /** 策略类型 */
  strategy: RecoveryStrategy;
  /** 是否自动执行 */
  autoExecute: boolean;
  /** 最大重试次数 */
  maxRetries: number;
  /** 重试延迟（毫秒） */
  retryDelay: number;
  /** 策略描述 */
  description: string;
  /** 执行回调 */
  execute?: () => Promise<void> | void;
}

/**
 * 恢复结果
 */
export interface RecoveryResult {
  /** 是否成功 */
  success: boolean;
  /** 消息 */
  message: string;
  /** 新配置（如果有） */
  newConfig?: Partial<ExtractConfig>;
  /** 是否需要用户干预 */
  needsUserIntervention: boolean;
}

/**
 * 错误恢复策略映射
 */
const RECOVERY_STRATEGIES: Record<ExtendedErrorCode, RecoveryConfig> = {
  MEMORY_EXCEEDED: {
    strategy: 'reduce_quality',
    autoExecute: true,
    maxRetries: 3,
    retryDelay: 1000,
    description: '降低输出质量后重试',
  },
  FFMPEG_LOAD_FAILED: {
    strategy: 'switch_cdn',
    autoExecute: true,
    maxRetries: 2,
    retryDelay: 2000,
    description: '切换 CDN 源并重试',
  },
  VIDEO_DECODE_ERROR: {
    strategy: 'show_message',
    autoExecute: false,
    maxRetries: 0,
    retryDelay: 0,
    description: '视频文件可能已损坏',
  },
  UNSUPPORTED_FORMAT: {
    strategy: 'show_message',
    autoExecute: false,
    maxRetries: 0,
    retryDelay: 0,
    description: '不支持的视频格式',
  },
  UNKNOWN_ERROR: {
    strategy: 'refresh_page',
    autoExecute: false,
    maxRetries: 0,
    retryDelay: 0,
    description: '发生未知错误，建议刷新页面',
  },
  FILE_TOO_LARGE: {
    strategy: 'show_message',
    autoExecute: false,
    maxRetries: 0,
    retryDelay: 0,
    description: '文件过大，请选择较小的视频',
  },
  NETWORK_ERROR: {
    strategy: 'switch_cdn',
    autoExecute: true,
    maxRetries: 3,
    retryDelay: 3000,
    description: '网络错误，正在重试',
  },
  PERMISSION_DENIED: {
    strategy: 'manual_intervention',
    autoExecute: false,
    maxRetries: 0,
    retryDelay: 0,
    description: '需要授予权限',
  },
  INVALID_CONFIG: {
    strategy: 'show_message',
    autoExecute: false,
    maxRetries: 0,
    retryDelay: 0,
    description: '配置参数无效',
  },
  OPERATION_CANCELLED: {
    strategy: 'show_message',
    autoExecute: false,
    maxRetries: 0,
    retryDelay: 0,
    description: '操作已取消',
  },
  BROWSER_NOT_SUPPORTED: {
    strategy: 'show_message',
    autoExecute: false,
    maxRetries: 0,
    retryDelay: 0,
    description: '浏览器不支持此功能',
  },
};

/**
 * 质量降级配置
 */
const QUALITY_REDUCTION_STEPS = [
  { quality: 90, maxWidth: 1920, maxHeight: 1080 },
  { quality: 80, maxWidth: 1280, maxHeight: 720 },
  { quality: 70, maxWidth: 960, maxHeight: 540 },
  { quality: 60, maxWidth: 640, maxHeight: 360 },
];

/**
 * 恢复服务类
 */
class RecoveryService {
  private retryCount: Map<string, number> = new Map();
  private currentCDNIndex: number = 0;

  /**
   * 获取恢复策略
   */
  getRecoveryStrategy(errorCode: ExtendedErrorCode): RecoveryConfig {
    return RECOVERY_STRATEGIES[errorCode] || RECOVERY_STRATEGIES.UNKNOWN_ERROR;
  }

  /**
   * 执行恢复策略
   */
  async executeRecovery(
    error: unknown,
    currentConfig?: ExtractConfig,
    onConfigChange?: (config: Partial<ExtractConfig>) => void
  ): Promise<RecoveryResult> {
    const classifiedError = classifyError(error);
    const strategy = this.getRecoveryStrategy(classifiedError.code);
    const errorKey = classifiedError.code;
    
    // 检查重试次数
    const currentRetries = this.retryCount.get(errorKey) || 0;
    if (currentRetries >= strategy.maxRetries) {
      return {
        success: false,
        message: `已达到最大重试次数 (${strategy.maxRetries})，${getRecoveryAction(classifiedError.code)}`,
        needsUserIntervention: true,
      };
    }

    // 根据策略执行恢复
    switch (strategy.strategy) {
      case 'reduce_quality':
        return this.reduceQualityAndRetry(classifiedError, currentConfig, onConfigChange);
      
      case 'switch_cdn':
        return this.switchCDNAndRetry(classifiedError);
      
      case 'show_message':
        return {
          success: false,
          message: getRecoveryAction(classifiedError.code),
          needsUserIntervention: true,
        };
      
      case 'refresh_page':
        return {
          success: false,
          message: '发生严重错误，建议刷新页面',
          needsUserIntervention: true,
        };
      
      case 'manual_intervention':
        return {
          success: false,
          message: getRecoveryAction(classifiedError.code),
          needsUserIntervention: true,
        };
      
      default:
        return {
          success: false,
          message: '无法自动恢复',
          needsUserIntervention: true,
        };
    }
  }

  /**
   * 降低质量并重试
   */
  private reduceQualityAndRetry(
    error: ClassifiedError,
    currentConfig?: ExtractConfig,
    onConfigChange?: (config: Partial<ExtractConfig>) => void
  ): RecoveryResult {
    if (!currentConfig) {
      return {
        success: false,
        message: '无法降低质量：缺少当前配置',
        needsUserIntervention: true,
      };
    }

    const errorKey = error.code;
    const currentRetries = this.retryCount.get(errorKey) || 0;
    const step = QUALITY_REDUCTION_STEPS[Math.min(currentRetries, QUALITY_REDUCTION_STEPS.length - 1)];

    // 更新重试计数
    this.retryCount.set(errorKey, currentRetries + 1);

    // 计算新配置
    const newConfig: Partial<ExtractConfig> = {
      quality: step.quality,
      maxWidth: step.maxWidth,
      maxHeight: step.maxHeight,
    };

    // 回调配置变更
    onConfigChange?.(newConfig);

    return {
      success: true,
      message: `已降低输出质量 (${step.quality}%)，正在重试...`,
      newConfig,
      needsUserIntervention: false,
    };
  }

  /**
   * 切换 CDN 并重试
   */
  private switchCDNAndRetry(error: ClassifiedError): RecoveryResult {
    const errorKey = error.code;
    const currentRetries = this.retryCount.get(errorKey) || 0;
    
    // 更新重试计数
    this.retryCount.set(errorKey, currentRetries + 1);
    
    // 切换到下一个 CDN
    this.currentCDNIndex = (this.currentCDNIndex + 1) % 2;

    return {
      success: true,
      message: `正在切换 CDN 源重试...`,
      needsUserIntervention: false,
    };
  }

  /**
   * 检查是否可以自动恢复
   */
  canAutoRecover(error: unknown): boolean {
    const classifiedError = classifyError(error);
    const strategy = this.getRecoveryStrategy(classifiedError.code);
    
    if (!strategy.autoExecute) {
      return false;
    }

    const currentRetries = this.retryCount.get(classifiedError.code) || 0;
    return currentRetries < strategy.maxRetries;
  }

  /**
   * 获取当前重试次数
   */
  getRetryCount(errorCode: ExtendedErrorCode): number {
    return this.retryCount.get(errorCode) || 0;
  }

  /**
   * 重置重试计数
   */
  resetRetryCount(errorCode?: ExtendedErrorCode): void {
    if (errorCode) {
      this.retryCount.delete(errorCode);
    } else {
      this.retryCount.clear();
    }
  }

  /**
   * 获取当前 CDN 索引
   */
  getCurrentCDNIndex(): number {
    return this.currentCDNIndex;
  }

  /**
   * 重置 CDN 索引
   */
  resetCDNIndex(): void {
    this.currentCDNIndex = 0;
  }

  /**
   * 延迟执行
   */
  delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  /**
   * 带重试的执行函数
   */
  async withRetry<T>(
    fn: () => Promise<T>,
    options: {
      errorCode: ExtendedErrorCode;
      maxRetries?: number;
      retryDelay?: number;
      onRetry?: (attempt: number, error: Error) => void;
    }
  ): Promise<T> {
    const { maxRetries = 3, retryDelay = 1000, onRetry } = options;
    let lastError: Error | null = null;

    for (let attempt = 0; attempt <= maxRetries; attempt++) {
      try {
        return await fn();
      } catch (error) {
        lastError = error instanceof Error ? error : new Error(String(error));
        
        if (attempt < maxRetries) {
          onRetry?.(attempt + 1, lastError);
          await this.delay(retryDelay * (attempt + 1)); // 指数退避
        }
      }
    }

    throw lastError;
  }

  /**
   * 获取用户友好的恢复建议
   */
  getRecoverySuggestion(error: unknown): string {
    const classifiedError = classifyError(error);
    const strategy = this.getRecoveryStrategy(classifiedError.code);
    
    if (strategy.autoExecute && this.canAutoRecover(error)) {
      return `${strategy.description}，正在自动重试...`;
    }
    
    return getRecoveryAction(classifiedError.code);
  }
}

// 导出单例
export const recoveryService = new RecoveryService();

// 导出类型和函数
export {
  RECOVERY_STRATEGIES,
  QUALITY_REDUCTION_STEPS,
};
