import { Ratelimit } from "@upstash/ratelimit";
import { Redis } from "@upstash/redis";

const redis = new Redis({
  url: process.env.UPSTASH_REDIS_REST_URL!,
  token: process.env.UPSTASH_REDIS_REST_TOKEN!,
});

const ratelimit = new Ratelimit({
  redis: redis,
  limiter: Ratelimit.slidingWindow(5, "15 m"),
});

export async function checkRateLimit(identifier: string) {
  try {
    const { success, remaining, reset } = await ratelimit.limit(identifier);
    return { success, remaining, reset };
  } catch (error) {
    console.error("Rate limit check failed:", error);
    // Si falla Redis, permitir la acción (fallback)
    return { success: true, remaining: 5, reset: Date.now() + 15 * 60 * 1000 };
  }
}
