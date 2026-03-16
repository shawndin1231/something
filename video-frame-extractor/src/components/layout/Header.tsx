/**
 * Video Frame Extractor - Header Component
 * 应用顶部导航栏组件
 */

import { Film, Sun, Moon, Github } from 'lucide-react';

interface HeaderProps {
  /** 是否为暗色模式 */
  isDark: boolean;
  /** 切换主题回调 */
  onToggleTheme: () => void;
}

/**
 * Header 组件
 * 包含 Logo、主题切换按钮和 GitHub 链接
 */
export function Header({ isDark, onToggleTheme }: HeaderProps) {
  return (
    <header
      className="
        sticky top-0 z-50
        w-full
        bg-white/80 dark:bg-gray-950/80
        backdrop-blur-md
        border-b border-gray-200 dark:border-gray-800
        h-16 md:h-14
      "
    >
      <div
        className="
          mx-auto
          max-w-[1280px]
          px-4 md:px-6
          h-full
          flex items-center justify-between
        "
      >
        {/* Logo 区域 */}
        <div className="flex items-center gap-2.5">
          <Film
            className="
              w-6 h-6 md:w-5 md:h-5
              text-primary-500
            "
            aria-hidden="true"
          />
          <h1
            className="
              text-lg md:text-base
              font-semibold
              text-gray-900 dark:text-gray-100
            "
          >
            视频拆帧工具
          </h1>
        </div>

        {/* 操作按钮区域 */}
        <div className="flex items-center gap-2">
          {/* 主题切换按钮 */}
          <button
            onClick={onToggleTheme}
            className="
              p-2
              rounded-lg
              text-gray-600 dark:text-gray-400
              hover:bg-gray-100 dark:hover:bg-gray-800
              hover:text-gray-900 dark:hover:text-gray-100
              transition-colors duration-200
              focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-500
            "
            aria-label={isDark ? '切换到亮色模式' : '切换到暗色模式'}
          >
            {isDark ? (
              <Sun className="w-5 h-5" aria-hidden="true" />
            ) : (
              <Moon className="w-5 h-5" aria-hidden="true" />
            )}
          </button>

          {/* GitHub 链接按钮 */}
          <a
            href="https://github.com"
            target="_blank"
            rel="noopener noreferrer"
            className="
              p-2
              rounded-lg
              text-gray-600 dark:text-gray-400
              hover:bg-gray-100 dark:hover:bg-gray-800
              hover:text-gray-900 dark:hover:text-gray-100
              transition-colors duration-200
              focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-500
            "
            aria-label="访问 GitHub 仓库"
          >
            <Github className="w-5 h-5" aria-hidden="true" />
          </a>
        </div>
      </div>
    </header>
  );
}

export default Header;
