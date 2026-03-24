# bg-remove

图片背景移除网站

## 项目结构

```
bg-remove/
├── worker/              # Cloudflare Worker 后端
│   ├── index.ts         # Worker 主逻辑
│   └── wrangler.toml    # Cloudflare 配置
└── frontend/            # Next.js 前端
    └── src/app/page.tsx # 主页
```

## 部署步骤

### 1. 部署 Worker

```bash
cd worker
npm install -g wrangler
wrangler login          # 登录 Cloudflare
wrangler secret put REMOVE_BG_API_KEY  # 设置 Remove.bg API Key
wrangler deploy         # 部署 Worker
```

部署后得到 Worker URL，如：`https://bg-remove-api.xxx.workers.dev`

### 2. 部署前端到 Cloudflare Pages

```bash
cd frontend
npm install
npm run build
```

在 Cloudflare Dashboard → Pages → Create project → Direct upload，上传 `.next` 目录。

### 3. 使用

1. 打开前端网站
2. 填入 Worker URL
3. 上传图片点击移除背景
4. 下载结果

## Remove.bg API Key

从 https://www.remove.bg/developers 获取 API Key

免费额度：每月 50 张图片
