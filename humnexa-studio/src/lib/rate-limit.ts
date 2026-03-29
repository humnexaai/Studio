type RateLimitEntry = {
  count: number;
  resetAt: number;
};

const requestMap = new Map<string, RateLimitEntry>();

export function checkRateLimit(
  userId: string,
  limit: number,
  windowMs: number,
): { success: boolean; remaining: number } {
  const now = Date.now();
  const key = `${userId}:${windowMs}`;
  const existing = requestMap.get(key);

  if (!existing || now >= existing.resetAt) {
    const next: RateLimitEntry = {
      count: 1,
      resetAt: now + windowMs,
    };
    requestMap.set(key, next);
    return { success: true, remaining: Math.max(limit - 1, 0) };
  }

  if (existing.count >= limit) {
    return { success: false, remaining: 0 };
  }

  existing.count += 1;
  requestMap.set(key, existing);
  return { success: true, remaining: Math.max(limit - existing.count, 0) };
}
