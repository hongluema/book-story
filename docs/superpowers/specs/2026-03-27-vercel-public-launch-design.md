# Vercel 公开上线配置设计文档

## Context
- 当前项目已经具备基础的 Next.js 14 页面、故事生成接口和本地故事播放能力，可以在本地完成“选择主题 -> 调用模型 -> 进入故事页”的主链路。
- 用户希望把应用部署到 Vercel，并且默认对外开放生成能力，而不是只做本地演示。
- 一旦公开开放，生成接口就会同时面临两个问题：
  - 成本问题：大模型生成会产生真实费用，不能裸奔。
  - 体验问题：如果继续静默回退到默认故事，线上用户会误以为“生成成功但内容不对”。

## Goals
1. 应用可以直接部署到 Vercel，并通过环境变量完成生产配置。
2. 公开用户可以直接使用“生成故事”能力，不需要登录。
3. 生成接口默认具备基础防刷能力，包括服务端限流和人机校验。
4. 失败场景要明确可见，不再只靠 fallback story 掩盖问题。
5. 配置和文档足够清晰，便于后续在 Vercel 控制台一次性完成上线。

## Non-Goals
- 不引入账号系统、会员系统或付费墙。
- 不做复杂风控，如设备指纹、黑名单后台、运营审核台。
- 不在这一版引入数据库存储生成历史；公开上线仍以本地存储和即时生成体验为主。

## Requirements

### 1. 公开可用的生成链路
- 首页和生成页继续对所有访客开放。
- 用户提交主题或自定义提示词后，前端先获取 Turnstile token，再调用 `/api/generate-story`。
- 只有当 Turnstile 校验通过、限流通过时，服务端才会请求大模型。

### 2. 明确的错误反馈
- 生成成功时，接口返回结构化 `story` 数据，前端照常跳转到故事页。
- 生成失败时，接口返回明确错误，不再默认伪装成“生成成功”。
- 前端要能区分并提示以下场景：
  - 人机校验失败
  - 触发频率限制
  - 上游模型不可用或额度耗尽
  - 返回内容解析失败

### 3. 生产环境保护
- 所有敏感密钥仅保存在服务端环境变量中。
- 限流按 IP 生效，窗口明确。
- 人机校验结果必须在服务端向 Turnstile 校验，不能只在前端判断。
- 需要保留服务端日志，便于排查模型调用和校验失败原因，但日志中不能输出完整密钥。

### 4. 部署准备完整
- 提供 `.env.example`，列出本地和 Vercel 所需变量。
- README 增加 Vercel 部署步骤。
- 如果当前默认行为不适合公开上线，需要同步调整接口和前端提交逻辑。

## Recommended Approach

采用以下组合：

- `Cloudflare Turnstile`
  - 用于拦截最基础的脚本滥用和批量刷接口。
- `Upstash Redis + @upstash/ratelimit`
  - 用于服务端按 IP 做滑动窗口限流。
- `Vercel + Next.js Route Handler`
  - 保持当前架构，不额外引入独立后端。

不额外增加账号体系或数据库，先把公开可用和成本可控做稳。

## Architecture

### 1. 前端提交流程
- 在 `GenerateForm` 中接入 Turnstile 小组件。
- 用户点击“生成故事”后：
  - 先检查当前是否拿到有效的 Turnstile token。
  - 将 `topic`、`customPrompt`、`turnstileToken` 一起提交到 `/api/generate-story`。
- 前端增加提交中状态，避免用户重复点击。
- 服务端返回错误时，前端在当前页面展示清晰的错误文案，不跳转到故事页。

### 2. 服务端生成流程
`/api/generate-story` 的处理顺序固定为：

1. 解析请求体
2. 校验 `topic`、`customPrompt`、`turnstileToken`
3. 调用 Turnstile 服务端校验
4. 解析客户端 IP
5. 执行 Upstash 限流
6. 调用大模型生成故事
7. 解析模型返回内容
8. 返回成功结果或结构化错误

顺序不能反过来。原因是：
- 先做人机校验，再做限流，可以减少无意义的 Redis 写入。
- 在调用大模型之前就拦住非法请求，避免浪费模型费用。

### 3. 限流策略
第一版采用单层 IP 限流：

- Key：`generate-story:{clientIp}`
- 窗口：`5 次 / 10 分钟`
- 算法：滑动窗口

选择这个值的理由：
- 对普通家长来说足够宽松，不会影响正常试用。
- 对公开站点来说，已经能拦住一部分高频滥用。
- 相比“每分钟一次”更不容易误伤短时间内连续尝试不同主题的真实用户。

如果后续成本压力依旧较高，再追加更严格的日级限制，但第一版不做双层策略，避免复杂度过高。

### 4. 错误协议
接口不再只返回 fallback story，而是返回统一错误结构：

```json
{
  "error": {
    "type": "rate_limited",
    "message": "生成次数有点多了，请稍后再试。"
  }
}
```

错误类型固定为：
- `bad_request`
- `captcha_failed`
- `rate_limited`
- `model_error`
- `parse_failed`

HTTP 状态码约定：
- `200`：生成成功
- `400`：请求参数不完整或非法
- `403`：Turnstile 校验失败
- `429`：超过限流
- `502`：模型调用失败或模型返回不可解析内容

这样前端可以明确提示，不再通过 fallback story 假装成功。

### 5. fallback story 的角色调整
- fallback story 继续保留，用于以下场景：
  - 本地演示
  - 故事页兜底展示
  - 某些历史逻辑依赖
- 但在公开生成接口里，不再把 fallback 作为“生成失败时的默认成功响应”。
- 线上生成失败应该返回错误，由前端提示用户重新尝试。

## Vercel Deployment Model

### 1. 运行方式
- 保持标准 Next.js 部署到 Vercel。
- `app/api/generate-story/route.ts` 明确使用 Node.js runtime，避免在 Edge 环境中遇到三方 SDK 兼容问题。
- 首版不强制新增 `vercel.json`。只要代码层明确 runtime，且环境变量配置齐全，就能部署。

### 2. 生产环境变量
需要统一整理到 `.env.example` 并在 Vercel 控制台配置：

- `OPENAI_API_KEY`
  - 上游兼容 OpenAI 协议服务的密钥
- `OPENAI_BASE_URL`
  - 上游兼容接口地址，例如 DashScope compatible mode 地址
- `MODEL_NAME`
  - 线上使用的模型名
- `TURNSTILE_SECRET_KEY`
  - Cloudflare Turnstile 服务端密钥
- `NEXT_PUBLIC_TURNSTILE_SITE_KEY`
  - Cloudflare Turnstile 前端站点公钥
- `UPSTASH_REDIS_REST_URL`
  - Upstash Redis REST 地址
- `UPSTASH_REDIS_REST_TOKEN`
  - Upstash Redis REST Token

### 3. 不在客户端暴露的配置
以下变量绝不能出现在前端代码中：
- `OPENAI_API_KEY`
- `TURNSTILE_SECRET_KEY`
- `UPSTASH_REDIS_REST_TOKEN`

前端只允许读取 `NEXT_PUBLIC_TURNSTILE_SITE_KEY`。

## User Experience

### 1. 成功路径
- 用户选择主题并输入提示词
- 完成人机校验
- 点击生成
- 页面显示“正在生成”
- 成功后跳转到故事页

### 2. 失败路径
前端根据错误类型显示中文提示：

- `captcha_failed`
  - “请先完成安全验证后再试。”
- `rate_limited`
  - “生成次数有点多了，请 10 分钟后再试。”
- `model_error`
  - “故事生成暂时不可用，请稍后再试。”
- `parse_failed`
  - “这次故事没生成成功，请再试一次。”
- `bad_request`
  - “提交内容不完整，请检查后重试。”

提示应显示在表单附近，不跳转页面，也不静默失败。

## Observability

### 1. 服务端日志
- 记录以下关键信息：
  - 错误类型
  - topic
  - model
  - baseURL
  - rate limit 命中情况
  - Turnstile 校验结果
- 不记录完整密钥。
- 对模型原始输出只保留截断后的预览，避免日志过大。

### 2. 线上排查优先级
线上出问题时，优先查看：
1. Turnstile 是否校验失败
2. Upstash 是否开始大量限流
3. 模型供应商是否返回额度或权限错误
4. 模型返回是否不符合当前故事 JSON 结构

## Testing Plan

### 1. 接口测试
- 新增路由测试，覆盖：
  - Turnstile 校验通过 + 限流通过 + 模型成功
  - Turnstile 校验失败，返回 `403`
  - 限流命中，返回 `429`
  - 模型调用失败，返回 `502`
  - 模型返回不可解析，返回 `502`

### 2. 前端测试
- 生成表单测试覆盖：
  - 未完成人机校验时不能提交
  - 接口返回错误时显示对应文案
  - 成功时仍然跳转到故事页

### 3. 手工验证
- 本地使用测试 key 跑通一次完整提交流程
- 在 Vercel Preview 环境验证：
  - 环境变量读取正常
  - Turnstile 可用
  - Upstash 限流生效
  - DashScope 或其他模型供应商可正常返回

## Implementation Surface

这一版预计会涉及以下文件：

- Modify: `app/api/generate-story/route.ts`
- Modify: `components/generate/generate-form.tsx`
- Modify: `tests/app/generate-route.test.ts`
- Modify: `tests/app/generate-page.test.tsx`
- Create: `lib/rate-limit.ts`
- Create: `lib/turnstile.ts`
- Create: `.env.example`
- Modify: `README.md`

如果接入 Turnstile 需要单独的前端包装组件，也可以新增：
- Create: `components/generate/turnstile-widget.tsx`

## Unknowns & Assumptions
- 假设 Vercel 生产环境可以正常访问 Turnstile、Upstash 和模型服务。
- 假设公开体验以中文移动端为主，不额外处理多语言提示。
- 假设第一版无需后台运营面板；日志和 Vercel 控制台足以完成排查。
- 假设 Turnstile 通过脚本方式接入即可满足当前页面需求，不需要额外引入更重的表单框架。

## Decision Summary
- 公开上线采用 `Vercel + Cloudflare Turnstile + Upstash Ratelimit`。
- 生成接口不再用 fallback story 掩盖真实失败。
- 生产环境通过环境变量完成所有敏感配置。
- 第一版以“可公开使用但基础防刷可靠”为目标，不追加账号系统和复杂风控。
