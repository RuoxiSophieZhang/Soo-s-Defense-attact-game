# SOO 星际先锋 (SOO Star Pioneer)

一款基于 React + Vite 开发的马卡龙色系太空射击游戏。

## 🚀 快速开始

### 1. 安装依赖
```bash
npm install
```

### 2. 本地开发
```bash
npm run dev
```
访问 `http://localhost:3000` 即可开始游戏。

### 3. 构建生产版本
```bash
npm run build
```

## 🎨 自定义资源

你可以通过替换 `public/assets/` 文件夹中的图片来更换游戏素材：
- `player.png`: 玩家战机
- `enemy_basic.png`: 基础敌机
- `enemy_fast.png`: 快速敌机
- `enemy_heavy.png`: 重型敌机
- `powerup_triple.png`: 三向子弹道具
- `powerup_shield.png`: 护盾道具

## 🌐 部署到 Vercel

1. 将代码上传到 GitHub 仓库。
2. 在 [Vercel](https://vercel.com) 中导入该 GitHub 仓库。
3. Vercel 会自动识别 Vite 配置并完成部署。
4. 在 Vercel 项目设置中绑定你在阿里云购买的域名。

## 🛠 技术栈
- React 19
- Vite
- Tailwind CSS
- Lucide React (图标)
- Motion (动画)
- Web Audio API (音效)
