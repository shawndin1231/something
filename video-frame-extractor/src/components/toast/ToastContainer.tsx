/**
 * Toast Container 组件
 * 管理所有 Toast 的容器
 */

import { Toast } from './Toast';
import { useToastContext } from './ToastContext';

/**
 * Toast Container 组件
 * 渲染所有活跃的 Toast 通知
 */
export function ToastContainer() {
  const { toasts, removeToast } = useToastContext();

  if (toasts.length === 0) {
    return null;
  }

  return (
    <div
      aria-label="通知"
      className={`
        fixed z-50
        flex flex-col gap-2
        w-full max-w-sm
        pointer-events-none
        bottom-0 right-0
        p-4 sm:p-6
      `.replace(/\s+/g, ' ').trim()}
    >
      {toasts.map((toast) => (
        <div key={toast.id} className="pointer-events-auto">
          <Toast toast={toast} onClose={removeToast} />
        </div>
      ))}
    </div>
  );
}

export default ToastContainer;
