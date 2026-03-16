/**
 * Toast Context
 * 提供 Toast 通知的状态管理
 */

import {
  createContext,
  useContext,
  useReducer,
  useCallback,
  type ReactNode,
} from 'react';

/**
 * Toast 类型
 */
export type ToastType = 'success' | 'error' | 'warning' | 'info';

/**
 * Toast 配置
 */
export interface ToastConfig {
  /** 唯一标识 */
  id: string;
  /** Toast 类型 */
  type: ToastType;
  /** 标题 */
  title: string;
  /** 描述信息（可选） */
  description?: string;
  /** 持续时间（毫秒），0 表示不自动关闭 */
  duration?: number;
  /** 是否显示关闭按钮 */
  closable?: boolean;
  /** 关闭回调 */
  onClose?: () => void;
  /** 操作按钮配置 */
  action?: {
    label: string;
    onClick: () => void;
  };
}

/**
 * 默认持续时间配置
 */
export const DEFAULT_DURATIONS: Record<ToastType, number> = {
  success: 4000,
  error: 6000,
  warning: 5000,
  info: 4000,
};

/**
 * Toast 状态
 */
interface ToastState {
  toasts: ToastConfig[];
}

/**
 * Toast Action 类型
 */
type ToastAction =
  | { type: 'ADD'; payload: ToastConfig }
  | { type: 'REMOVE'; payload: string }
  | { type: 'REMOVE_ALL' }
  | { type: 'UPDATE'; payload: { id: string; config: Partial<ToastConfig> } };

/**
 * 初始状态
 */
const initialState: ToastState = {
  toasts: [],
};

/**
 * Toast Reducer
 */
function toastReducer(state: ToastState, action: ToastAction): ToastState {
  switch (action.type) {
    case 'ADD':
      return {
        ...state,
        toasts: [...state.toasts, action.payload],
      };

    case 'REMOVE':
      return {
        ...state,
        toasts: state.toasts.filter((toast) => toast.id !== action.payload),
      };

    case 'REMOVE_ALL':
      return {
        ...state,
        toasts: [],
      };

    case 'UPDATE':
      return {
        ...state,
        toasts: state.toasts.map((toast) =>
          toast.id === action.payload.id
            ? { ...toast, ...action.payload.config }
            : toast
        ),
      };

    default:
      return state;
  }
}

/**
 * Context 值类型
 */
interface ToastContextValue {
  /** 当前所有 Toast */
  toasts: ToastConfig[];
  /** 添加 Toast */
  addToast: (config: Omit<ToastConfig, 'id'>) => string;
  /** 移除 Toast */
  removeToast: (id: string) => void;
  /** 移除所有 Toast */
  removeAllToasts: () => void;
  /** 更新 Toast */
  updateToast: (id: string, config: Partial<ToastConfig>) => void;
  /** 快捷方法：显示成功 Toast */
  success: (title: string, description?: string) => string;
  /** 快捷方法：显示错误 Toast */
  error: (title: string, description?: string) => string;
  /** 快捷方法：显示警告 Toast */
  warning: (title: string, description?: string) => string;
  /** 快捷方法：显示信息 Toast */
  info: (title: string, description?: string) => string;
}

/**
 * Toast Context
 */
const ToastContext = createContext<ToastContextValue | null>(null);

/**
 * 生成唯一 ID
 */
function generateId(): string {
  return `toast-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
}

/**
 * Toast Provider 属性
 */
interface ToastProviderProps {
  children: ReactNode;
  /** 最大显示数量 */
  maxToasts?: number;
}

/**
 * Toast Provider 组件
 */
export function ToastProvider({ children, maxToasts = 5 }: ToastProviderProps) {
  const [state, dispatch] = useReducer(toastReducer, initialState);

  /**
   * 添加 Toast
   */
  const addToast = useCallback(
    (config: Omit<ToastConfig, 'id'>): string => {
      const id = generateId();
      const toast: ToastConfig = {
        ...config,
        id,
        duration: config.duration ?? DEFAULT_DURATIONS[config.type],
        closable: config.closable ?? true,
      };

      dispatch({ type: 'ADD', payload: toast });

      // 如果超过最大数量，移除最早的
      if (state.toasts.length >= maxToasts) {
        const oldestId = state.toasts[0].id;
        dispatch({ type: 'REMOVE', payload: oldestId });
      }

      return id;
    },
    [state.toasts.length, maxToasts]
  );

  /**
   * 移除 Toast
   */
  const removeToast = useCallback((id: string) => {
    dispatch({ type: 'REMOVE', payload: id });
  }, []);

  /**
   * 移除所有 Toast
   */
  const removeAllToasts = useCallback(() => {
    dispatch({ type: 'REMOVE_ALL' });
  }, []);

  /**
   * 更新 Toast
   */
  const updateToast = useCallback((id: string, config: Partial<ToastConfig>) => {
    dispatch({ type: 'UPDATE', payload: { id, config } });
  }, []);

  /**
   * 快捷方法
   */
  const success = useCallback(
    (title: string, description?: string) => addToast({ type: 'success', title, description }),
    [addToast]
  );

  const error = useCallback(
    (title: string, description?: string) => addToast({ type: 'error', title, description }),
    [addToast]
  );

  const warning = useCallback(
    (title: string, description?: string) => addToast({ type: 'warning', title, description }),
    [addToast]
  );

  const info = useCallback(
    (title: string, description?: string) => addToast({ type: 'info', title, description }),
    [addToast]
  );

  const value: ToastContextValue = {
    toasts: state.toasts,
    addToast,
    removeToast,
    removeAllToasts,
    updateToast,
    success,
    error,
    warning,
    info,
  };

  return (
    <ToastContext.Provider value={value}>{children}</ToastContext.Provider>
  );
}

/**
 * 使用 Toast 的 Hook
 * @returns Toast 上下文值
 * @throws 如果在 ToastProvider 外部使用则抛出错误
 */
export function useToastContext(): ToastContextValue {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error('useToastContext must be used within a ToastProvider');
  }
  return context;
}

/**
 * 导出 Context 用于特殊情况
 */
export { ToastContext };
