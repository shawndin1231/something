/**
 * Video Frame Extractor - MainLayout Component
 * 主布局容器组件
 */

import { type ReactNode } from 'react';

interface MainLayoutProps {
  /** 子组件 */
  children: ReactNode;
}

/**
 * MainLayout 组件
 * 提供统一的页面布局容器
 */
export function MainLayout({ children }: MainLayoutProps) {
  return (
    <main
      className="
        flex-1
        w-full
        mx-auto
        max-w-[1280px]
        px-4 md:px-6
        py-4 md:py-6
        flex flex-col
        gap-6
      "
    >
      {children}
    </main>
  );
}

export default MainLayout;
