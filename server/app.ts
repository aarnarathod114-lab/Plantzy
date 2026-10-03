import express, { type NextFunction, type Request, type Response } from 'express';
import { AiError, GENERIC_HEALTH_GUIDANCE, createAiService, type AiService } from './ai.js';
import { config } from './config.js';
import { offlineAnswer } from './offlineAssistant.js';
import { createRateLimiter } from './rateLimit.js';
import { uniqueInOrder } from './resilience.js';
import { LIMITS, ValidationError, cleanText, parseCoordinate, parseImage } from './validation.js';
import { WeatherError, createWeatherService } from './weather.js';

/**
 * The API as an Express app, with no listener attached.
 *
 * `server/index.ts` adds the frontend and listens on a port for local and
 * single-server hosting. `api/index.ts` exports this same app as a serverless
 * function for Vercel, where the built frontend is served as static files.
 */
const app = express();
app.disable('x-powered-by');
if (config.trustProxy) app.set('trust proxy', 1);

const ai: AiService | null = config.geminiApiKey
  ? createAiService({
      apiKey: config.geminiApiKey,
      models: uniqueInOrder([config.geminiModel, ...config.geminiFallbackModels]),
      attemptTimeoutMs: config.aiAttemptTimeoutMs,
      budgetMs: config.aiBudgetMs,
    })
  : null;

const weather = createWeatherService({
  fetch: (url, init) => fetch(url, init),
  now: () => Date.now(),
  timeoutMs: config.upstreamTimeoutMs,
});

const aiLimiter = createRateLimiter({ windowMs: 60_000, max: config.aiRateLimitPerMinute });
const weatherLimiter = createRateLimiter({ windowMs: 60_000, max: 60 });

// ---------------------------------------------------------------------------
// Middleware
// ---------------------------------------------------------------------------

app.use((_req: Request, res: Response, next: NextFunction) => {
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'DENY');
  res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
  res.setHeader('Permissions-Policy', 'camera=(), microphone=(), geolocation=()');
  if (config.isProduction) {
    // Vite's dev server injects inline scripts for HMR, so the CSP is production-only.
    res.setHeader(
      'Content-Security-Policy',
      [
        "default-src 'self'",
        "script-src 'self'",
        "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
        "font-src 'self' https://fonts.gstatic.com",
        "img-src 'self' data: blob: https:",
        "connect-src 'self'",
        "object-src 'none'",
        "base-uri 'self'",
        "frame-ancestors 'none'",
      ].join('; ')
    );
  }
  next();
});

app.use(express.json({ limit: config.jsonBodyLimit }));

function limit(limiter: ReturnType<typeof createRateLimiter>) {
  return (req: Request, res: Response, next: NextFunction) => {
    const result = limiter.check(req.ip ?? 'unknown');
    res.setHeader('RateLimit-Remaining', String(result.remaining));
    if (!result.allowed) {
      res.setHeader('Retry-After', String(result.retryAfterSec));
      res.status(429).json({
        success: false,
        error: 'rate_limited',
        message: `Too many requests. Try again in ${result.retryAfterSec} seconds.`,
      });
      return;
    }
    next();
  };
}

const AI_NOT_CONFIGURED = {
  success: false,
  error: 'ai_not_configured',
  message: 'AI features are not enabled on this server. Search the catalog or add the plant manually instead.',
} as const;

// ---------------------------------------------------------------------------
// Routes
// ---------------------------------------------------------------------------

app.get('/api/health', (_req: Request, res: Response) => {
  res.json({ ok: true, aiEnabled: ai !== null });
});

app.get('/api/weather', limit(weatherLimiter), async (req: Request, res: Response) => {
  const city = cleanText(req.query.city, LIMITS.city);
  const lat = parseCoordinate(req.query.lat, -90, 90);
  const lon = parseCoordinate(req.query.lon, -180, 180);

  if (!city && (lat === null || lon === null)) {
    res.status(400).json({ success: false, error: 'invalid_request', message: 'Provide a city, or lat and lon.' });
    return;
  }

  try {
    res.json({ success: true, weather: await weather.get({ city, lat, lon }) });
  } catch (err) {
    if (err instanceof WeatherError) {
      const status = err.code === 'city_not_found' ? 404 : 502;
      res.status(status).json({ success: false, error: err.code, message: err.message });
      return;
    }
    console.error('Weather error:', err);
    res.status(502).json({ success: false, error: 'upstream_unavailable', message: 'Weather is unavailable right now.' });
  }
});

app.post('/api/ai/assistant', limit(aiLimiter), async (req: Request, res: Response) => {
  const question = cleanText(req.body?.question, LIMITS.question);
  if (!question) {
    res.status(400).json({ success: false, error: 'invalid_request', message: 'A question is required.' });
    return;
  }

  if (ai) {
    try {
      res.json({ success: true, answer: await ai.ask(question, req.body?.userContext) });
      return;
    } catch (err) {
      console.error('Assistant error:', err);
    }
  }
  // No key, or the model call failed: answer from general guidance and say so.
  res.json({ success: true, isFallback: true, answer: offlineAnswer(question) });
});

app.post('/api/ai/identify', limit(aiLimiter), async (req: Request, res: Response) => {
  let image;
  try {
    image = parseImage(req.body?.imageBase64, req.body?.mimeType);
  } catch (err) {
    res.status(400).json({ success: false, error: 'invalid_request', message: (err as ValidationError).message });
    return;
  }
  const description = cleanText(req.body?.description, LIMITS.description);

  if (!image && !description) {
    res.status(400).json({ success: false, error: 'invalid_request', message: 'Send a photo or a description.' });
    return;
  }
  if (!ai) {
    res.status(503).json(AI_NOT_CONFIGURED);
    return;
  }

  try {
    const plant = await ai.identify(image, description);
    if (!plant) {
      res.status(422).json({
        success: false,
        error: 'not_identified',
        message: 'Could not identify a plant from that. Try a clearer photo of the leaves, or search the catalog.',
      });
      return;
    }
    res.json({ success: true, plant });
  } catch (err) {
    console.error('Identification error:', err);
    res.status(502).json({
      success: false,
      error: 'ai_unavailable',
      message: err instanceof AiError ? err.message : 'Identification is unavailable right now. Please try again.',
    });
  }
});

app.post('/api/ai/health-check', limit(aiLimiter), async (req: Request, res: Response) => {
  let image;
  try {
    image = parseImage(req.body?.imageBase64, req.body?.mimeType);
  } catch (err) {
    res.status(400).json({ success: false, error: 'invalid_request', message: (err as ValidationError).message });
    return;
  }
  const symptoms = cleanText(req.body?.symptoms, LIMITS.symptoms);

  if (!image && !symptoms) {
    res.status(400).json({ success: false, error: 'invalid_request', message: 'Send a photo or describe the symptoms.' });
    return;
  }

  if (ai) {
    try {
      const analysis = await ai.healthCheck(image, symptoms, req.body?.plantContext);
      if (analysis) {
        res.json({ success: true, analysis });
        return;
      }
    } catch (err) {
      console.error('Health check error:', err);
    }
  }
  // A general checklist is still useful, but it must not look like an analysis of this plant.
  res.json({ success: true, isFallback: true, analysis: GENERIC_HEALTH_GUIDANCE });
});

app.use('/api', (_req: Request, res: Response) => {
  res.status(404).json({ success: false, error: 'not_found', message: 'Unknown API route.' });
});

// Malformed JSON, oversized bodies and anything else that slipped through.
app.use((err: Error & { status?: number; type?: string }, _req: Request, res: Response, _next: NextFunction) => {
  if (err.type === 'entity.too.large') {
    res.status(413).json({ success: false, error: 'payload_too_large', message: 'That upload is too large.' });
    return;
  }
  if (err.status === 400) {
    res.status(400).json({ success: false, error: 'invalid_request', message: 'Request body is not valid JSON.' });
    return;
  }
  console.error('Unhandled error:', err);
  res.status(500).json({ success: false, error: 'internal_error', message: 'Something went wrong.' });
});

export { ai };
export default app;
