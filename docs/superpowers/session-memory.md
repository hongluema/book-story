# 项目记忆

## 项目概况
- 项目：面向 2-3 岁宝宝的中文睡前绘本故事应用
- 技术栈：`Next.js 14`、`React 18`、`TypeScript`、`Vitest`
- 目标：部署到 `Vercel`，默认对外开放生成能力，同时控制滥用和成本

## 已确认的核心决策
- 大模型调用统一走 `@langchain/openai` 的 `ChatOpenAI`
- 模型配置读取：
  - `MODEL_NAME`
  - `OPENAI_API_KEY`
  - `OPENAI_BASE_URL`
- 公开上线保护方案：
  - `Cloudflare Turnstile`
  - `Upstash Redis + @upstash/ratelimit`
- 生成失败时不再返回 fallback story 伪装成功，而是返回正式错误

## 已完成的主要改动
- `app/api/generate-story/route.ts`
  - 已改成 `ChatOpenAI`
  - 已接入 `Turnstile -> IP 限流 -> 模型调用 -> 解析`
  - 已返回正式错误协议：
    - `400 bad_request`
    - `403 captcha_failed`
    - `429 rate_limited`
    - `502 model_error`
    - `502 parse_failed`
  - 已声明 `runtime = 'nodejs'`
- `components/generate/generate-form.tsx`
  - 已要求先完成人机校验
  - 已提交 `turnstileToken`
  - 已支持提交中状态和中文错误提示
- `components/generate/turnstile-widget.tsx`
  - 已接入 Cloudflare Turnstile 前端组件
- `lib/turnstile.ts`
  - 已封装 Turnstile 服务端校验
- `lib/rate-limit.ts`
  - 已封装 Upstash 滑动窗口限流
- `README.md`
  - 已补 Vercel 部署步骤
  - 已补上线前检查清单
- `.env.example`
  - 已补全所有生产环境变量模板

## 为什么之前看起来总是默认故事
- 旧版本接口把异常和解析失败都静默吞掉，直接返回 `fallbackStory`
- 现在已经改掉，线上失败会返回明确错误，不再假装成功

## 已碰到的真实问题
- DashScope / `qwen-plus` 返回过：
  - `403 The free tier of the model has been exhausted...`
- 结论：
  - 不是代码没读到 `OPENAI_API_KEY` / `OPENAI_BASE_URL`
  - 是上游模型免费额度耗尽，且账号启用了“只用免费额度”

## 当前上线所需环境变量
- `OPENAI_API_KEY`
- `OPENAI_BASE_URL`
- `MODEL_NAME`
- `NEXT_PUBLIC_TURNSTILE_SITE_KEY`
- `TURNSTILE_SECRET_KEY`
- `UPSTASH_REDIS_REST_URL`
- `UPSTASH_REDIS_REST_TOKEN`

## 这些 key 去哪里拿
- `NEXT_PUBLIC_TURNSTILE_SITE_KEY` / `TURNSTILE_SECRET_KEY`
  - 去 `Cloudflare Turnstile` 控制台创建站点后获取
- `UPSTASH_REDIS_REST_URL` / `UPSTASH_REDIS_REST_TOKEN`
  - 去 `Upstash Redis` 控制台创建数据库后获取

## 已验证状态
- `pnpm vitest --run` 通过
- `pnpm build` 通过
- 说明当前代码已具备 Vercel 生产构建能力

## 当前限制
- 当前目录不是 Git 仓库
- 所以这轮无法直接提交 commit / 开 PR

## 后续建议优先级
1. 在 Vercel 配齐全部环境变量
2. 在 Cloudflare Turnstile 配置 Vercel 域名 hostname
3. 在 Upstash 创建 Redis 并填入 Vercel
4. 先跑 Preview 环境验证一次完整生成
5. 再验证限流和模型额度不足时的页面提示

## 后续协作提示
- 如果你下次说“按记忆继续”，默认参考本文件
- 如果产品方向变了，优先更新这份文件，而不是重新口头铺一遍上下文
