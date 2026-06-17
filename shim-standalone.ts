// shim-standalone.ts
//
// Run the middleware shim as its own process (the second run model):
//
//   RAG_API_URL=http://localhost:5000 npm run shim
//
// Use this when you want the shim to outlive Vite restarts or to drive it from
// something other than Vite (Playwright, a MediaWiki-less e2e run, curl, ...).
// The in-process model (`npm run dev:shim`) is the simpler default.
//
// Env:
//   RAG_API_URL          base URL of the RAG backend  (default http://localhost:5000)
//   SHIM_PORT            port to listen on             (default 3002)
//   SHIM_SEND_PAGE_ID    send page_id from referrer    (default true; "false" to disable)
//   SHIM_MAX_QUESTIONS   per-user question cap         (default 0 = unlimited)
//   SHIM_QUESTION_CHARS  question char limit           (default 0 = unlimited)
//   SHIM_FEEDBACK_CHARS  feedback char limit           (default 0 = unlimited)
import { startShimServer } from './shim-server';

const num = (value: string | undefined): number => (value ? parseInt(value, 10) || 0 : 0);

startShimServer({
  ragUrl: process.env.RAG_API_URL || 'http://localhost:5000',
  port: num(process.env.SHIM_PORT) || 3002,
  sendPageId: process.env.SHIM_SEND_PAGE_ID !== 'false',
  limits: {
    maxQuestions: num(process.env.SHIM_MAX_QUESTIONS),
    questionChars: num(process.env.SHIM_QUESTION_CHARS),
    feedbackChars: num(process.env.SHIM_FEEDBACK_CHARS),
  },
}).catch((err) => {
  console.error('Failed to start shim server:', err);
  process.exit(1);
});
