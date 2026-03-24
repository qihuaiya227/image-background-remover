# 图片背景移除工具 — MVP 需求文档

> 项目代号：bg-remove  
> 版本：v1.0 MVP  
> 日期：2026-03-24  
> 负责人：祁淮

---

## 一、产品概述

**产品名称**：Image BG Remover（图片背景移除工具）

**一句话描述**：一款简洁高效的在线图片背景移除工具，用户上传图片即可获得透明背景结果。

**核心价值**：无需复杂操作，三步完成背景移除，下载即用。

**技术选型**：
- 前端：Next.js（部署于 Cloudflare Pages）
- 后端：Cloudflare Worker（API 代理层）
- 核心能力：Remove.bg API（每月 50 张免费额度）

---

## 二、用户故事

### 2.1 目标用户

- 需要快速移除图片背景的非专业用户
- 电商卖家、产品设计师、自媒体创作者
- 需要透明底证件照、产品图的从业者

### 2.2 核心场景

| 场景 | 用户行为 | 系统响应 |
|------|----------|----------|
| 上传图片 | 点击上传区或拖拽图片 | 实时预览原图 |
| 处理图片 | 点击"移除背景"按钮 | 调用 API，返回结果图 |
| 下载结果 | 点击"下载"按钮 | 保存 PNG 图片到本地 |

---

## 三、功能需求

### 3.1 必须实现（MVP）

#### F1：图片上传
- 支持点击上传或拖拽上传
- 支持格式：JPG、PNG、WebP
- 前端实时预览上传图片
- 上传后自动清空上一次结果

#### F2：背景移除
- 用户手动填入 Worker API 地址
- 支持配置化的 API 地址切换（方便调试）
- 点击按钮触发 Remove.bg API 调用
- 处理中显示 loading 状态
- 异常时展示错误信息

#### F3：结果展示与下载
- 成功后显示无背景结果图
- 提供 PNG 格式下载按钮
- 下载文件名：`removed-bg.png`

#### F4：重新上传
- 支持重新选择图片替换当前原图
- 重新上传后清空上一次结果

### 3.2 不纳入 MVP（后续版本）

- 用户体系 / 登录
- 历史记录
- 批量处理
- 自定义背景色替换
- API Key 在前端存储与管理

---

## 四、非功能需求

### 4.1 性能
- 图片上传到预览 < 1s（本地预览，不上传服务器）
- API 响应时间依赖 Remove.bg（通常 3-10s）
- 大图（>10MB）建议在前端压缩后再处理

### 4.2 兼容性
- 桌面端：Chrome / Firefox / Safari / Edge 最新版
- 移动端：iOS Safari / Android Chrome
- 响应式布局，适配 375px 以上屏幕宽度

### 4.3 安全
- 图片仅在用户浏览器与 Worker 之间传输，不经过本服务器
- API Key 存储于 Cloudflare Worker 环境变量，不暴露于前端
- CORS 已配置，允许跨域访问

---

## 五、页面结构

```
┌──────────────────────────────────────┐
│           🪄 图片背景移除              │  ← 标题
├──────────────────────────────────────┤
│  API 地址： [输入框]                  │  ← 可配置
├──────────────────────────────────────┤
│                                      │
│      📤 点击或拖拽上传图片             │  ← 上传区
│      （上传后显示图片预览）             │
│                                      │
├──────────────────────────────────────┤
│  [ 移除背景 ]  [ 重新上传 ]            │  ← 操作按钮
├──────────────────────────────────────┤
│                                      │
│         ✨ 结果区域                   │  ← 处理后显示
│      （显示透明背景结果图）              │
│      [ ⬇️ 下载 PNG ]                  │
│                                      │
└──────────────────────────────────────┘
```

---

## 六、API 接口设计

### 6.1 Worker 端点

**POST /**

请求：
```
Content-Type: multipart/form-data
Body: image_file (File)
```

响应：
```
Content-Type: image/png
Body: <PNG 二进制数据>
```

错误响应：
```
Content-Type: text/plain
Body: Error: <错误信息>
Status: 400 / 500
```

### 6.2 前端调用

```typescript
const formData = new FormData();
formData.append('image_file', imageBlob, 'image.png');

const res = await fetch(workerUrl, {
  method: 'POST',
  body: formData,
});

if (!res.ok) throw new Error(await res.text());
const resultBlob = await res.blob();
```

---

## 七、部署架构

```
用户浏览器
    │
    │  HTTPS POST (图片)
    ▼
Cloudflare Worker  ←── REMOVE_BG_API_KEY（环境变量）
    │
    │  API 调用
    ▼
Remove.bg API
    │
    │  PNG 数据
    ▼
用户浏览器（展示 + 下载）
```

**部署步骤：**

1. **Worker 部署**
   ```bash
   cd worker
   wrangler login
   wrangler secret put REMOVE_BG_API_KEY
   wrangler deploy
   ```
   获得：`https://bg-remove-api.xxx.workers.dev`

2. **前端部署**
   ```bash
   cd frontend
   npm install
   npm run build
   ```
   Cloudflare Pages → Direct upload → 上传 `.next` 目录

3. **配置前端**
   将 Worker URL 填入前端 API 地址栏即可使用

---

## 八、Mock 数据与测试

### 8.1 测试图片建议
- 人物照（半身照效果最佳）
- 产品图（白色或纯色背景效果最佳）
- 证件照

### 8.2 边界测试
- 空图片上传 → 提示错误
- 非图片文件 → 提示错误
- API Key 错误 → 展示 API 错误信息
- 网络超时 → 展示超时错误

---

## 九、迭代计划

### MVP（当前）
- [x] 页面 UI
- [x] 图片上传与预览
- [x] Worker API 代理
- [x] 结果展示与下载

### v1.1（后续）
- [ ] API 地址本地存储（sessionStorage）
- [ ] 移动端适配优化
- [ ] 移除背景进度提示

### v1.2
- [ ] 用户可切换不同背景色
- [ ] 处理张数统计

---

## 十、附录

### Remove.bg API 文档
https://www.remove.bg/api

### Cloudflare Workers 文档
https://developers.cloudflare.com/workers/

### 免费额度
- Remove.bg：每月 50 张免费
- Cloudflare Workers：每日 100,000 请求（免费版）
- Cloudflare Pages：无带宽限制

---

_文档版本：v1.0 | 最后更新：2026-03-24_
