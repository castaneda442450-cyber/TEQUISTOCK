import { Ratelimit } from "@upstash/ratelimit";
import { Redis } from "@upstash/redis";

const redis = new Redis({
  url: process.env.UPSTASH_REDIS_REST_URL!,
  token: process.env.UPSTASH_REDIS_REST_TOKEN!,
});

// Para login: límite estricto de seguridad
const loginRatelimit = new Ratelimit({
  redis,
  limiter: Ratelimit.slidingWindow(5, "15 m"),
});

// Para operaciones de inventario: límite holgado para uso normal
const inventoryRatelimit = new Ratelimit({
  redis,
  limiter: Ratelimit.slidingWindow(60, "1 m"),
});

export async function checkRateLimit(identifier: string) {
  const isLogin = identifier.startsWith("login:");
  const limiter = isLogin ? loginRatelimit : inventoryRatelimit;
  const fallbackRemaining = isLogin ? 5 : 60;

  try {
    const { success, remaining, reset } = await limiter.limit(identifier);
    return { success, remaining, reset };
  } catch (error) {
    console.error("Rate limit check failed:", error);
    return { success: true, remaining: fallbackRemaining, reset: Date.now() + 60 * 1000 };
  }
}
