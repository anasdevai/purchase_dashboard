import { rateLimit, type Options } from "express-rate-limit";

/** Human-friendly "retry in X" string for 429 messages. */
function formatRetryAfter(seconds: number): string {
  if (seconds <= 0) return "a moment";
  if (seconds < 60) return `${seconds} second${seconds === 1 ? "" : "s"}`;
  const minutes = Math.ceil(seconds / 60);
  if (minutes < 60) return `${minutes} minute${minutes === 1 ? "" : "s"}`;
  const hours = Math.ceil(minutes / 60);
  return `${hours} hour${hours === 1 ? "" : "s"}`;
}

type LimiterConfig = {
  windowMs: number;
  limit: number;
  message: string;
  /** When true, successful responses (2xx/3xx) do not count toward the limit. */
  skipSuccessfulRequests?: boolean;
};

/**
 * Builds a rate limiter whose 429 response tells the caller when to retry.
 * Adds a `Retry-After` header plus `retryAfterSeconds`/`retryAfter` in the JSON body.
 */
function createRateLimiter({ windowMs, limit, message, skipSuccessfulRequests }: LimiterConfig) {
  return rateLimit({
    windowMs,
    limit,
    standardHeaders: "draft-7",
    legacyHeaders: false,
    skipSuccessfulRequests: skipSuccessfulRequests ?? false,
    handler: (req, res, _next, options: Options) => {
      const resetTime = (req as { rateLimit?: { resetTime?: Date } }).rateLimit?.resetTime;
      const retryAfterSeconds = resetTime
        ? Math.max(0, Math.ceil((resetTime.getTime() - Date.now()) / 1000))
        : Math.ceil(options.windowMs / 1000);

      res.setHeader("Retry-After", String(retryAfterSeconds));
      res.status(options.statusCode).json({
        error: `${message} Please try again in ${formatRetryAfter(retryAfterSeconds)}.`,
        message: `${message} Please try again in ${formatRetryAfter(retryAfterSeconds)}.`,
        retryAfterSeconds,
        retryAfter: formatRetryAfter(retryAfterSeconds)
      });
    }
  });
}

/** General-purpose limiter for non-auth API routers. */
/**
 * General-purpose limiter shared by every non-auth /api router. A single
 * authenticated dashboard load fans out to ~6 endpoints, and the SPA polls a
 * few counts in the background, so 100/15min was far too low and tripped 429s
 * on normal use. 1000/15min (~66 req/min per IP) still guards against abuse
 * while comfortably covering dashboard loads, refreshes and navigation.
 */
export const apiLimiter = createRateLimiter({
  windowMs: 15 * 60 * 1000, // 15 minutes
  limit: 1000,
  message: "Too many requests from this IP."
});

/**
 * Login: 10 attempts / 15 minutes. Successful logins are not counted, so a
 * legitimate user is never locked out by their own valid sign-ins — only
 * repeated failed/abusive attempts consume the budget.
 */
export const loginLimiter = createRateLimiter({
  windowMs: 15 * 60 * 1000, // 15 minutes
  limit: 10,
  message: "Too many login attempts.",
  skipSuccessfulRequests: true
});

/** Signup: 5 accounts / hour per IP. */
export const signupLimiter = createRateLimiter({
  windowMs: 60 * 60 * 1000, // 1 hour
  limit: 5,
  message: "Too many sign-up attempts."
});

/** /auth/me: polled on app load/refresh, so allow a generous budget. */
export const authMeLimiter = createRateLimiter({
  windowMs: 5 * 60 * 1000, // 5 minutes
  limit: 120,
  message: "Too many requests."
});

/** Logout: very high limit (essentially unrestricted) to avoid blocking sign-outs. */
export const logoutLimiter = createRateLimiter({
  windowMs: 60 * 1000, // 1 minute
  limit: 60,
  message: "Too many logout requests."
});
