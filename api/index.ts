// Vercel entry point: the whole API runs as one serverless function.
// `vercel.json` routes every /api/* request here; Express does the rest.
import app from '../server/app.js';

export default app;
