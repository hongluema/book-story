# 中文睡前绘本故事应用

## 本地运行

```bash
pnpm install
pnpm dev
```

打开 `http://localhost:3000`

## 环境变量

复制 `.env.example` 为 `.env.local`，并填写实际值：

```bash
cp .env.example .env.local
```

必填变量：

```bash
OPENAI_API_KEY=your_provider_key
OPENAI_BASE_URL=https://dashscope.aliyuncs.com/compatible-mode/v1
MODEL_NAME=qwen-plus
NEXT_PUBLIC_TURNSTILE_SITE_KEY=your_turnstile_site_key
TURNSTILE_SECRET_KEY=your_turnstile_secret_key
UPSTASH_REDIS_REST_URL=https://your-instance.upstash.io
UPSTASH_REDIS_REST_TOKEN=your_upstash_token
```

## Vercel 部署

1. 在 Vercel 导入项目
2. 在 Cloudflare Turnstile 创建站点，拿到 `NEXT_PUBLIC_TURNSTILE_SITE_KEY` 和 `TURNSTILE_SECRET_KEY`
3. 在 Upstash 创建 Redis，拿到 `UPSTASH_REDIS_REST_URL` 和 `UPSTASH_REDIS_REST_TOKEN`
4. 在 Vercel Project Settings -> Environment Variables 中配置：
   - `OPENAI_API_KEY`
   - `OPENAI_BASE_URL`
   - `MODEL_NAME`
   - `NEXT_PUBLIC_TURNSTILE_SITE_KEY`
   - `TURNSTILE_SECRET_KEY`
   - `UPSTASH_REDIS_REST_URL`
   - `UPSTASH_REDIS_REST_TOKEN`
5. 触发一次重新部署

## 上线前检查清单

- 已在 Cloudflare Turnstile 为生产域名配置 widget hostname
- 已在 Vercel 配置所有环境变量
- 已在 Upstash 创建 Redis 并写入 Vercel 环境变量
- `/api/generate-story` 在 Preview 环境能成功返回生成故事
- 限流命中时页面能看到中文错误提示

## 验收清单

- 首页可查看推荐故事、主题入口、最近听过
- 家长可通过主题或自定义输入生成故事
- 播放页可查看绘本页、白噪音入口、晚安语
- 收藏与最近听过可在本地保存

## 已知前提

- 运行环境需要能访问 npm registry，否则依赖安装会失败
- 当前 `public/audio/*.mp3` 是占位文件，接真实播放前需要替换为真实音频资源

## 记忆文件

我把内容压成“项目记忆文件”，包含产品方向、已完成改动、上线配置、已知问题和下一步。现在已经整理好了，
放在 docs/superpowers/session-memory.md。

这份文件里压缩了：

- 项目目标和技术栈
- 已完成的关键改动
- Vercel 上线方案
- 环境变量清单
- 已遇到的真实问题
- 当前限制和下一步建议

后面你直接说“按记忆继续”或者“更新记忆文件”，我就基于这份继续。
