import dotenv from 'dotenv';

dotenv.config();

function intFromEnv(name: string, fallback: number, min: number, max: number): number {
  const parsed = Number.parseInt(process.env[name] ?? '', 10);
  if (!Number.isFinite(parsed)) return fallback;
  return Math.min(max, Math.max(min, parsed));
}

export const config = {
  port: intFromEnv('PORT', 3000, 1, 65535),
  isProduction: process.env.NODE_ENV === 'production' || process.argv.includes('--production'),
  geminiApiKey: (process.env.GEMINI_API_KEY ?? '').trim(),
  geminiModel: (process.env.GEMINI_MODEL ?? '').trim() || 'gemini-3.8-flash',
  /** Tried in order when the preferred model is overloaded, rate limited or slow. */
  geminiFallbackModels: (process.env.GEMINI_FALLBACK_MODELS ?? 'gemini-3.7-flash,gemini-3.5-flash').split(','),
  // Vercel always sits behind its own proxy, so trust it there without extra configuration.
  trustProxy: Boolean(process.env.VERCEL) || ['1', 'true'].includes((process.env.TRUST_PROXY ?? '').toLowerCase()),
  aiRateLimitPerMinute: intFromEnv('AI_RATE_LIMIT_PER_MINUTE', 20, 1, 10_000),
  /** Upper bound for JSON bodies. An 8 MB photo is ~10.7 MB once base64-encoded. */
  jsonBodyLimit: '12mb',
  upstreamTimeoutMs: 8_000,
  /** One model call. */
  aiAttemptTimeoutMs: 20_000,
  /** The whole AI request across fallbacks. Must stay below the function limit in vercel.json. */
  aiBudgetMs: 45_000,
} as const;
