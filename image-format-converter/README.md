# Image Format Converter

一个基于 Web 的图片格式转换工具，所有处理在浏览器中完成，无需上传到服务器。用户可以上传图片文件，选择目标格式和质量参数，然后转换并下载。

## 功能特性

- **浏览器端处理** - 基于 Canvas API，所有图片处理在浏览器中完成，无需上传到服务器
- **多种图片格式支持** - 支持 PNG、JPG、WebP、GIF、BMP 等常见格式的相互转换
- **灵活的转换配置** - 可设置输出格式、图片质量和输出尺寸
- **批量转换** - 支持一次上传多张图片并批量转换
- **批量下载** - 支持单张下载和批量 ZIP 打包下载
- **预览对比** - 显示转换前后图片预览和文件大小对比
- **暗色模式** - 支持亮色/暗色主题，自动检测系统偏好

## 技术栈

| 技术 | 版本 | 用途 |
|------|------|------|
| React | 19.x | UI 框架 |
| TypeScript | 5.x | 类型安全 |
| Vite | 8.x | 构建工具 |
| Tailwind CSS | 4.x | 样式框架 |
| Canvas API | - | 图片处理核心 |
| JSZip | 3.x | ZIP 文件打包 |
| FileSaver.js | 2.x | 文件下载 |
| Lucide React | - | 图标库 |

## 快速开始

### 环境要求

- Node.js 18+
- 现代浏览器（Chrome、Firefox、Safari、Edge 最新版本）

### 安装依赖

```bash
cd image-format-converter
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

1. **上传图片** - 拖拽或点击上传区域选择图片文件（支持多选）
2. **配置参数** - 选择目标格式、图片质量（JPG/WebP）和输出尺寸
3. **开始转换** - 点击"开始转换"按钮，等待处理完成
4. **预览结果** - 查看转换前后图片预览和文件大小对比
5. **下载图片** - 单击下载按钮下载单张图片，或点击"全部下载"打包下载

## 支持的图片格式

| 格式 | 输入支持 | 输出支持 | 说明 |
|------|----------|----------|------|
| PNG | ✅ | ✅ | 无损压缩，支持透明 |
| JPG/JPEG | ✅ | ✅ | 有损压缩，文件小 |
| WebP | ✅ | ✅ | 现代格式，压缩率高 |
| GIF | ✅ | ✅ | 支持动图（仅首帧转换） |
| BMP | ✅ | ✅ | 无压缩位图 |
| TIFF | ✅ | ❌ | 专业格式，仅支持读取 |
| SVG | ✅ | ❌ | 矢量图，仅支持读取 |

## 配置选项

| 配置项 | 说明 | 默认值 |
|--------|------|--------|
| 输出格式 | PNG / JPG / WebP / GIF / BMP | PNG |
| 图片质量 | 1-100（仅 JPG/WebP 有效） | 90 |
| 尺寸调整 | 保持原始 / 自定义宽度 / 自定义高度 | 保持原始 |
| 锁定宽高比 | 调整尺寸时保持宽高比 | 开启 |

## 项目结构

```
image-format-converter/
├── public/                     # 静态资源
├── src/
│   ├── components/             # React 组件
│   │   ├── config/             # 配置面板组件
│   │   ├── download/           # 下载相关组件
│   │   ├── layout/             # 布局组件
│   │   ├── ui/                 # 通用 UI 组件
│   │   └── upload/             # 上传组件
│   ├── context/                # React Context 状态管理
│   ├── services/               # 服务层
│   ├── types/                  # TypeScript 类型定义
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
idle → uploading → configuring → converting → completed
                         ↓                    ↓
                      error ← ← ← ← ← ← ← ← ←
```

### 核心模块

- **ImageConverter** - Canvas API 封装，实现图片格式转换
- **DownloadService** - 下载服务，支持 ZIP 打包和进度显示
- **AppContext** - 全局状态管理

## 注意事项

- **文件大小**：单张图片最大 20MB，批量总大小最大 200MB
- **批量限制**：单次最多上传 100 张图片
- **GIF 转换**：仅转换动图的第一帧
- **隐私安全**：所有处理在浏览器本地完成，不会上传任何数据到服务器

## 许可证

MIT
