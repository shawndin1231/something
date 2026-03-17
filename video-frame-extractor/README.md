# Video Frame Extractor

一个基于 Web 的视频帧提取工具，使用 FFmpeg.wasm 在浏览器端进行视频处理，无需后端服务器。用户可以上传视频文件，配置提取参数，然后提取视频帧并下载。

## 功能特性

- **浏览器端处理** - 基于 FFmpeg.wasm，所有视频处理在浏览器中完成，无需上传到服务器
- **多种视频格式支持** - 支持 MP4、AVI、MOV、MKV、WebM、FLV 等常见格式
- **灵活的提取配置** - 可设置提取间隔、输出格式、图片质量和输出尺寸
- **批量下载** - 支持单帧下载和批量 ZIP 打包下载
- **帧管理** - 支持选择、删除单个或多个帧
- **暗色模式** - 支持亮色/暗色主题切换，自动检测系统偏好
- **无障碍支持** - 完善的键盘导航和屏幕阅读器支持
- **高性能优化** - 多线程处理、并行 I/O、快速缩放算法

## 技术栈

| 技术 | 版本 | 用途 |
|------|------|------|
| React | 19.x | UI 框架 |
| TypeScript | 5.x | 类型安全 |
| Vite | 8.x | 构建工具 |
| Tailwind CSS | 4.x | 样式框架 |
| FFmpeg.wasm | 0.12.x | 浏览器端视频处理 |
| JSZip | 3.x | ZIP 文件打包 |
| Lucide React | 0.577.x | 图标库 |

## 快速开始

### 环境要求

- Node.js 18+
- 现代浏览器（支持 SharedArrayBuffer）

### 安装依赖

```bash
npm install
```

### 开发模式

```bash
npm run dev
```

### 构建生产版本

```bash
npm run build
```

### 预览生产版本

```bash
npm run preview
```

## 使用说明

1. **等待引擎加载** - 打开应用后，等待 FFmpeg 引擎加载完成（首次加载可能需要几秒钟）
2. **上传视频** - 拖拽或点击上传区域选择视频文件
3. **配置参数** - 设置提取间隔、输出格式、图片质量和输出尺寸
4. **开始提取** - 点击"开始提取"按钮，等待处理完成
5. **浏览和管理** - 在缩略图网格中浏览提取的帧，可选择删除不需要的帧
6. **下载图片** - 单击缩略图可预览，点击下载按钮可下载单帧或批量下载

## 配置选项

| 配置项 | 说明 | 默认值 |
|--------|------|--------|
| 提取间隔 | 每隔多少秒提取一帧 | 1 秒 |
| 输出格式 | PNG / JPEG / WebP | PNG |
| 图片质量 | 1-100（仅 JPEG/WebP 有效） | 90 |
| 输出尺寸 | 保持原始 / 自定义宽度 / 自定义高度 | 保持原始 |

## 项目结构

```
video-frame-extractor/
├── public/                     # 静态资源
├── src/
│   ├── components/             # React 组件
│   │   ├── accessibility/      # 无障碍组件
│   │   ├── config/             # 配置面板组件
│   │   ├── download/           # 下载相关组件
│   │   ├── error/              # 错误处理组件
│   │   ├── layout/             # 布局组件
│   │   ├── memory/             # 内存监控组件
│   │   ├── progress/           # 进度显示组件
│   │   ├── thumbnail/          # 缩略图组件
│   │   ├── toast/              # Toast 通知组件
│   │   ├── ui/                 # 通用 UI 组件
│   │   └── upload/             # 上传组件
│   ├── context/                # React Context 状态管理
│   ├── hooks/                  # 自定义 Hooks
│   ├── services/               # 服务层
│   ├── types/                  # TypeScript 类型定义
│   ├── utils/                  # 工具函数
│   ├── workers/                # Web Workers
│   ├── App.tsx                 # 主应用组件
│   └── main.tsx                # 入口文件
├── package.json
├── vite.config.ts
└── tsconfig.json
```

## 架构设计

### 状态管理

采用 React Context + useReducer 模式，实现类型安全的状态机：

```
idle → ffmpeg_loading → video_loading → configuring → extracting → completed
                         ↓                    ↓
                      error ← ← ← ← ← ← ← ← ←
```

### 核心模块

- **FFmpegService** - FFmpeg.wasm 封装，支持多 CDN 加载策略
- **DownloadService** - 下载服务，支持 ZIP 打包和进度显示
- **MemoryMonitor** - 内存监控，超过阈值时发出警告
- **ErrorBoundary** - 全局错误捕获和恢复机制

## 性能优化

### v0.1.0 性能优化更新

本版本对视频帧提取进行了全面的性能优化，提取速度提升约 **5-20 倍**：

#### FFmpeg 命令优化

| 优化项 | 说明 |
|--------|------|
| `-threads 0` | 自动使用所有可用 CPU 核心进行多线程处理 |
| `-an` | 跳过音频流处理，减少不必要的解码开销 |
| `-dn` | 跳过数据流处理 |
| `fast_bilinear` | 使用快速双线性缩放算法，比默认算法更快 |

#### 图片编码优化

| 格式 | 优化 |
|------|------|
| PNG | 设置 `-compression_level 0` 禁用压缩，大幅提升编码速度 |
| WebP | 设置 `-compression_level 0`，保留质量参数 |
| JPEG | 保持原有质量参数设置 |

#### I/O 优化

- **并行读取帧文件**：批量并行读取 16 个帧文件，提高 I/O 效率
- **减少内存复制**：优化帧数据处理流程，减少不必要的内存操作

### 性能建议

- 使用 **JPEG 格式** 可获得最快的编码速度
- 适当增加提取间隔可减少总帧数，提升整体速度
- 如需 PNG 格式，建议降低输出分辨率

## 注意事项

- **浏览器要求**：需要支持 SharedArrayBuffer 的现代浏览器（Chrome、Firefox、Safari 最新版本）
- **文件大小**：最大支持 1GB 视频文件，超过 500MB 会显示警告
- **性能建议**：建议单次提取帧数不超过 500 帧
- **首次加载**：FFmpeg.wasm 核心文件约 30MB，首次加载可能需要一些时间
- **格式限制**：目前仅支持 PNG、JPEG、WebP 三种输出格式

## 更新日志

### v0.1.0 (2025-03-17)

- 新增 FFmpeg 多线程处理支持
- 新增跳过音频/数据流处理优化
- 新增快速双线性缩放算法
- 新增 PNG/WebP 无压缩编码优化
- 新增帧文件并行读取（批量 16 个）
- 修复 FFmpeg progress 事件监听器未移除的问题

## 许可证

MIT
