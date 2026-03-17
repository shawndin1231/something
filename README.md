# Something - 多媒体工具集

一个包含多个浏览器端多媒体处理工具的仓库，所有处理均在本地完成，保护用户隐私。

## 项目列表

### 1. Video Frame Extractor（视频帧提取工具）

一个基于 Web 的视频帧提取工具，使用 FFmpeg.wasm 在浏览器端进行视频处理，无需后端服务器。

**功能特性：**
- 浏览器端处理 - 基于 FFmpeg.wasm，所有视频处理在浏览器中完成
- 多种视频格式支持 - MP4、AVI、MOV、MKV、WebM、FLV 等
- 灵活的提取配置 - 可设置提取间隔、输出格式、图片质量和输出尺寸
- 批量下载 - 支持单帧下载和批量 ZIP 打包下载
- 帧管理 - 支持选择、删除单个或多个帧

**目录：** `video-frame-extractor/`

---

### 2. Image Format Converter（图片格式转换工具）

一个基于 Web 的图片格式转换工具，使用 Canvas API 在浏览器端进行图片处理。

**功能特性：**
- 浏览器端处理 - 基于 Canvas API，所有图片处理在浏览器中完成
- 多种图片格式支持 - PNG、JPG、WebP、GIF、BMP、TIFF、SVG
- 灵活的转换配置 - 可设置输出格式、图片质量和输出尺寸
- 批量转换 - 支持一次上传多张图片并批量转换
- 批量下载 - 支持单张下载和批量 ZIP 打包下载
- 预览对比 - 显示转换前后图片预览和文件大小对比

**目录：** `image-format-converter/`

---

## 技术栈

| 技术 | 版本 | 用途 |
|------|------|------|
| React | 19.x | UI 框架 |
| TypeScript | 5.x | 类型安全 |
| Vite | 8.x | 构建工具 |
| Tailwind CSS | 4.x | 样式框架 |
| FFmpeg.wasm | 0.12.x | 浏览器端视频处理 |
| Canvas API | - | 浏览器端图片处理 |
| JSZip | 3.x | ZIP 文件打包 |
| FileSaver.js | 2.x | 文件下载 |
| Lucide React | - | 图标库 |

## 快速开始

### 环境要求

- Node.js 18+
- 现代浏览器（Chrome、Firefox、Safari、Edge 最新版本）

### 视频帧提取工具

```bash
cd video-frame-extractor
npm install
npm run dev
```

### 图片格式转换工具

```bash
cd image-format-converter
npm install
npm run dev
```

## 支持的格式

### 视频格式（视频帧提取）

| 格式 | 支持状态 |
|------|----------|
| MP4 | ✅ |
| AVI | ✅ |
| MOV | ✅ |
| MKV | ✅ |
| WebM | ✅ |
| FLV | ✅ |

### 图片格式（图片格式转换）

| 格式 | 输入 | 输出 | 说明 |
|------|------|------|------|
| PNG | ✅ | ✅ | 无损压缩，支持透明 |
| JPG/JPEG | ✅ | ✅ | 有损压缩，文件小 |
| WebP | ✅ | ✅ | 现代格式，压缩率高 |
| GIF | ✅ | ✅ | 支持动图（仅首帧转换） |
| BMP | ✅ | ✅ | 无压缩位图 |
| TIFF | ✅ | ❌ | 专业格式，仅支持读取 |
| SVG | ✅ | ❌ | 矢量图，仅支持读取 |

## 项目结构

```
something/
├── video-frame-extractor/      # 视频帧提取工具
│   ├── src/
│   │   ├── components/         # React 组件
│   │   ├── context/            # 状态管理
│   │   ├── hooks/              # 自定义 Hooks
│   │   ├── services/           # 服务层
│   │   ├── types/              # 类型定义
│   │   └── workers/            # Web Workers
│   └── package.json
│
├── image-format-converter/     # 图片格式转换工具
│   ├── src/
│   │   ├── components/         # React 组件
│   │   ├── context/            # 状态管理
│   │   ├── services/           # 服务层
│   │   └── types/              # 类型定义
│   └── package.json
│
└── README.md
```

## 架构设计

两个项目均采用相似的架构设计：

### 状态管理

采用 React Context + useReducer 模式，实现类型安全的状态机：

```
idle → loading → configuring → processing → completed
                  ↓                 ↓
               error ← ← ← ← ← ← ← ←
```

### 核心模块

**视频帧提取：**
- FFmpegService - FFmpeg.wasm 封装
- DownloadService - 下载服务
- MemoryMonitor - 内存监控

**图片格式转换：**
- ImageConverter - Canvas API 封装
- DownloadService - 下载服务

## 注意事项

### 视频帧提取工具
- 需要支持 SharedArrayBuffer 的现代浏览器
- 最大支持 1GB 视频文件
- FFmpeg.wasm 核心文件约 30MB，首次加载需要时间

### 图片格式转换工具
- 单张图片最大 20MB
- 批量总大小最大 200MB
- 单次最多上传 100 张图片
- GIF 转换仅支持首帧

### 通用
- 所有处理在浏览器本地完成
- 不会上传任何数据到服务器
- 保护用户隐私

## 许可证

MIT
