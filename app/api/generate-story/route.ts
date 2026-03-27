import { ChatOpenAI } from '@langchain/openai';
import { limitStoryGeneration } from '../../../lib/rate-limit';
import { parseGeneratedStory } from '../../../lib/story-parser';
import { buildStoryPrompt } from '../../../lib/story-prompt';
import { verifyTurnstileToken } from '../../../lib/turnstile';
import type { StoryTopic } from '../../../lib/story-types';

export const runtime = 'nodejs';

type GenerateStoryRequest = {
  topic: StoryTopic;
  customPrompt?: string;
  turnstileToken?: string;
};

type ErrorType = 'bad_request' | 'captcha_failed' | 'rate_limited' | 'model_error' | 'parse_failed';

type ErrorBody = {
  error: {
    type: ErrorType;
    message: string;
  };
};

const storyTopics: StoryTopic[] = ['刷牙', '分享', '勇敢', '睡觉习惯'];

export async function POST(request: Request) {
  let payload: Partial<GenerateStoryRequest>;

  try {
    payload = (await request.json()) as Partial<GenerateStoryRequest>;
  } catch (error) {
    reportGenerationIssue('Story request payload parsing failed.', {
      message: getErrorMessage(error),
    });
    return jsonError(400, 'bad_request', '提交内容不完整，请检查后重试。');
  }

  const topic = getStoryTopic(payload.topic);
  const customPrompt =
    typeof payload.customPrompt === 'string' && payload.customPrompt.trim()
      ? payload.customPrompt
      : undefined;
  const turnstileToken =
    typeof payload.turnstileToken === 'string' && payload.turnstileToken.trim()
      ? payload.turnstileToken.trim()
      : null;

  if (!topic || !turnstileToken) {
    return jsonError(400, 'bad_request', '提交内容不完整，请检查后重试。');
  }

  const clientIp = getClientIp(request);

  try {
    const captchaResult = await verifyTurnstileToken(turnstileToken, clientIp);
    if (!captchaResult.success) {
      reportGenerationIssue('Turnstile verification failed.', {
        topic,
        clientIp,
        errorCodes: captchaResult.errorCodes,
      });
      return jsonError(403, 'captcha_failed', '请先完成安全验证后再试。');
    }
  } catch (error) {
    reportGenerationIssue('Turnstile verification request failed.', {
      topic,
      clientIp,
      message: getErrorMessage(error),
    });
    return jsonError(502, 'captcha_failed', '安全验证暂时不可用，请稍后再试。');
  }

  try {
    const rateLimitResult = await limitStoryGeneration(clientIp);
    if (!rateLimitResult.success) {
      reportGenerationIssue('Rate limit exceeded.', {
        topic,
        clientIp,
        limit: rateLimitResult.limit,
        remaining: rateLimitResult.remaining,
        reset: rateLimitResult.reset,
      });
      return jsonError(429, 'rate_limited', '生成次数有点多了，请 10 分钟后再试。');
    }
  } catch (error) {
    reportGenerationIssue('Rate limit check failed.', {
      topic,
      clientIp,
      message: getErrorMessage(error),
    });
    return jsonError(502, 'model_error', '故事生成暂时不可用，请稍后再试。');
  }

  try {
    const model = new ChatOpenAI({
      model: process.env.MODEL_NAME,
      temperature: 0,
      apiKey: process.env.OPENAI_API_KEY,
      configuration: {
        baseURL: process.env.OPENAI_BASE_URL,
      },
    });

    const response = await model.invoke(buildStoryPrompt({ topic, customPrompt }));
    const story = parseGeneratedStory(extractContent(response.content));

    if (story.source === 'fallback') {
      reportGenerationIssue('Story response could not be parsed.', {
        topic,
        clientIp,
      });
      return jsonError(502, 'parse_failed', '这次故事没生成成功，请再试一次。');
    }

    return Response.json({ story }, { status: 200 });
  } catch (error) {
    reportGenerationIssue('Story generation request failed.', {
      topic,
      clientIp,
      model: process.env.MODEL_NAME ?? null,
      baseURL: process.env.OPENAI_BASE_URL ?? null,
      message: getErrorMessage(error),
    });
    return jsonError(502, 'model_error', '故事生成暂时不可用，请稍后再试。');
  }
}

function getStoryTopic(value: unknown): StoryTopic | null {
  if (typeof value !== 'string') {
    return null;
  }

  return storyTopics.includes(value as StoryTopic) ? (value as StoryTopic) : null;
}

function extractContent(
  content:
    | string
    | Array<string | { type?: string; text?: string; [key: string]: unknown }>
    | undefined,
): string {
  if (typeof content === 'string') {
    return content;
  }

  if (!Array.isArray(content)) {
    return '';
  }

  return content
    .map((item) => {
      if (typeof item === 'string') {
        return item;
      }
      if (item?.type === 'text' && typeof item.text === 'string') {
        return item.text;
      }
      return '';
    })
    .join('\n')
    .trim();
}

function jsonError(status: number, type: ErrorType, message: string) {
  return Response.json({ error: { type, message } } satisfies ErrorBody, { status });
}

function getClientIp(request: Request) {
  const forwardedFor = request.headers.get('x-forwarded-for');
  if (forwardedFor) {
    return forwardedFor.split(',')[0]?.trim() || 'unknown';
  }

  return request.headers.get('x-real-ip') || request.headers.get('cf-connecting-ip') || 'unknown';
}

function getErrorMessage(error: unknown) {
  return error instanceof Error ? error.message : 'Unknown error';
}

function reportGenerationIssue(message: string, details: unknown) {
  console.error(`[generate-story] ${message}`, details);
}
