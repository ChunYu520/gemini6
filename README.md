# Gemini Proxy Worker

一个简单的 Gemini API 中转服务，部署在 Cloudflare Workers 上。

## 部署方式

### 方式一：本地 Wrangler 部署

```bash
npx wrangler login
npx wrangler deploy
```

### 方式二：GitHub Actions 自动部署

1. 将此仓库关联到 Cloudflare Workers（Dashboard → Workers & Pages → 创建 Worker → 设置 → 绑定 GitHub 仓库）
2. 每次 push 到 `main` 分支会自动部署

## 使用方法

将官方 Gemini API 地址替换为你的 Worker 地址即可：

```
# 官方地址
https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent?key=YOUR_KEY

# 替换为你的 Worker
https://your-worker.your-subdomain.workers.dev/v1beta/models/gemini-pro:generateContent?key=YOUR_KEY
```

请求体和返回格式与官方 API 完全一致。

## 接口示例

```bash
curl -X POST \
  "https://your-worker.workers.dev/v1beta/models/gemini-pro:generateContent?key=YOUR_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "contents": [{
      "parts": [{"text": "Hello"}]
    }]
  }'
```
