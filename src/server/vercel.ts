/** Vercel serverless entry: bundled into api/index.js by `npm run build:api`. */
import { createApiApp } from './app';

export default createApiApp().app;
