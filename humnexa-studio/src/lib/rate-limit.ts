type RateLimitEntry = {
  count: number;
  resetAt: number;
};

type RateLimitResult = {
  success: boolean;
  remaining: number;
  retryAfter: number;
};

const requestMap = new Map<string, RateLimitEntry>();

function checkRateLimitByKey(
  key: string,
  limit: number,
  windowMs: number,
): RateLimitResult {
  const now = Date.now();
  const scopedKey = `${key}:${windowMs}`;
  const existing = requestMap.get(scopedKey);

  if (!existing || now >= existing.resetAt) {
    const next: RateLimitEntry = {
      count: 1,
      resetAt: now + windowMs,
    };
    requestMap.set(scopedKey, next);
    return {
      success: true,
      remaining: Math.max(limit - 1, 0),
      retryAfter: Math.ceil(windowMs / 1000),
    };
  }

  if (existing.count >= limit) {
    return {
      success: false,
      remaining: 0,
      retryAfter: Math.max(Math.ceil((existing.resetAt - now) / 1000), 1),
    };
  }

  existing.count += 1;
  requestMap.set(scopedKey, existing);
  return {
    success: true,
    remaining: Math.max(limit - existing.count, 0),
    retryAfter: Math.max(Math.ceil((existing.resetAt - now) / 1000), 1),
  };
}

export function checkRateLimit(
  userId: string,
  limit: number,
  windowMs: number,
): RateLimitResult {
  return checkRateLimitByKey(`user:${userId}`, limit, windowMs);
}

export function checkRateLimitByIp(
  ip: string,
  limit: number,
  windowMs: number,
): RateLimitResult {
  return checkRateLimitByKey(`ip:${ip}`, limit, windowMs);
}

export function getClientIpFromHeaders(headers: Headers): string {
  const forwardedFor = headers.get("x-forwarded-for");
  if (forwardedFor) {
    return forwardedFor.split(",")[0]?.trim() || "unknown";
  }
  return headers.get("x-real-ip") ?? "unknown";
}
