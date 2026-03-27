import { Ratelimit } from '@upstash/ratelimit';
import { Redis } from '@upstash/redis';

let ratelimit: Ratelimit | null = null;

function getRatelimit() {
  if (!ratelimit) {
    ratelimit = new Ratelimit({
      redis: Redis.fromEnv(),
      limiter: Ratelimit.slidingWindow(5, '10 m'),
      analytics: true,
      prefix: 'book-story:generate-story',
    });
  }

  return ratelimit;
}

export async function limitStoryGeneration(identifier: string) {
  return getRatelimit().limit(identifier);
}
