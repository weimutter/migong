# 在线迷宫挑战 (Maze Challenge)

一个使用 Next.js 和 Tailwind CSS 构建的在线迷宫小游戏。支持随机生成迷宫、多种难度、自动寻路提示以及战争迷雾模式。

## ✨ 特性

- **随机迷宫**：使用 DFS 算法生成，保证每次都有解。
- **多种难度**：提供简单、中等、困难、极限四种难度选择。
- **画线寻路**：支持鼠标/手指拖动绘制路径，操作直观流畅。
- **战争迷雾**：可开启迷雾模式，增加探索难度。
- **智能提示**：遇到困难时可使用提示功能查看最短路径。
- **响应式设计**：完美适配桌面端和移动端。

## 🛠️ 技术栈

- [Next.js](https://nextjs.org/) (App Router)
- [React](https://react.dev/)
- [TypeScript](https://www.typescriptlang.org/)
- [Tailwind CSS](https://tailwindcss.com/)
- HTML5 Canvas

## 🚀 快速开始

### 1. 安装依赖

```bash
npm install
```

### 2. 开发环境运行

```bash
npm run dev
```

打开浏览器访问 [http://localhost:3000](http://localhost:3000) 即可开始游戏。

### 3. 生产环境部署 (PM2)

本项目已配置 PM2 支持，适合在生产环境中长期运行。

**前置要求**：请确保服务器已安装 Node.js 和 NPM。如果未安装 PM2，请先全局安装：

```bash
npm install -g pm2
```

**部署步骤**：

1.  **构建项目**：

    ```bash
    npm run build
    ```

2.  **启动服务**：

    使用项目根目录下的 `ecosystem.config.js` 配置文件启动：

    ```bash
    pm2 start ecosystem.config.js
    ```

    或者使用 `npx` (如果未全局安装 PM2)：

    ```bash
    npx pm2 start ecosystem.config.js
    ```

3.  **管理服务**：

    - 查看状态：`pm2 status`
    - 查看日志：`pm2 logs`
    - 重启服务：`pm2 restart migong`
    - 停止服务：`pm2 stop migong`

## 🎮 操作指南

- **电脑端**：按住鼠标左键在迷宫格子上拖动，绘制通往终点的路线。
- **移动端**：手指按住屏幕在迷宫上滑动，绘制路线。
- **目标**：从左上角的蓝点出发，连接到右下角的红点。

## 📄 License

MIT
