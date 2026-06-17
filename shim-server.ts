// shim-server.ts
//
// A "middleware shim" that stands in for the KZChatbot MediaWiki layer during
// local development. It speaks the exact REST contract the React app expects
// (/kzchatbot/v0/{status,question,rate}) and forwards to a *real* RAG backend
// (the FastAPI service: POST /search, POST /rating).
//
// Difference from mockup-server.ts:
//   - mockup-server  → returns canned answers, needs no backend at all.
//   - shim-server    → talks to a live RAG, so you test the genuine pipeline
//                      without MediaWiki/PHP/DB. See README for the
//                      `kubectl port-forward` tunnel to the staging RAG.
//
// Identity model (continuous conversation):
//   - thread_id   = the durable, multi-turn thread (RAG redis key). The shim
//                   MINTS it on the first question of a thread, as
//                   `${uuid}:${uuidv4()}` — the uuid prefix namespaces it per
//                   user so a guessed thread component can't cross users, and
//                   the random part makes it unguessable. The client then
//                   carries this thread_id for every later turn + rating.
//   - conversation_id = a single Q&A turn (the RAG mints one per /search).
import express, { Request, Response } from 'express';
import cors from 'cors';
import http from 'http';
import { randomUUID } from 'crypto';

export interface ShimLimits {
  /** Max questions per user (uuid parsed from the thread_id prefix). 0 = unlimited. */
  maxQuestions?: number;
  /** Max characters in a question. 0 = unlimited. */
  questionChars?: number;
  /** Max characters in free-text feedback. 0 = unlimited. */
  feedbackChars?: number;
}

export interface ShimOptions {
  /** Base URL of the RAG backend, e.g. http://localhost:5000 */
  ragUrl: string;
  limits?: ShimLimits;
  /**
   * Whether to send page_id (derived from the referrer) to the RAG, mirroring
   * the KZChatbotSendPageId config. Default true. The MediaWiki layer also
   * checks ChatbotRagContent title relevance, which the shim can't replicate,
   * so here any positive-integer referrer is treated as a page id.
   */
  sendPageId?: boolean;
}

export interface ShimServer {
  url: string;
  port: number;
  close: () => Promise<void>;
}

const QUESTION_ROUTE = '/kzchatbot/v0/question';
const RATE_ROUTE = '/kzchatbot/v0/rate';
const STATUS_ROUTE = '/kzchatbot/v0/status';

const charLen = (value: unknown): number =>
  typeof value === 'string' ? Array.from(value).length : 0;

/** Mint a fresh, per-user-namespaced thread id. */
const mintThreadId = (uuid: unknown): string =>
  `${typeof uuid === 'string' && uuid ? `${uuid}:` : ''}${randomUUID()}`;

/** Extract the user uuid from a compound thread id (`uuid:random`). */
const uuidFromThreadId = (threadId: unknown): string | null => {
  if (typeof threadId !== 'string' || !threadId.includes(':')) return null;
  return threadId.split(':')[0] || null;
};

/**
 * A referrer is a page id when it is a positive integer. Mirrors the
 * `is_numeric( $referrer ) && (int)$referrer > 0` check in
 * ApiKZChatbotSubmitQuestion::getRelevantPageId().
 */
const pageIdFromReferrer = (referrer: unknown): string | null => {
  const n = typeof referrer === 'number' ? referrer : parseInt(String(referrer), 10);
  return Number.isInteger(n) && n > 0 ? String(n) : null;
};

/**
 * Ping the RAG's /health on startup so an unreachable backend shows up as one
 * clear warning instead of a stack trace on the first question. Non-blocking:
 * the RAG may come up later (e.g. once the kubectl port-forward is started).
 */
async function checkRagHealth(ragUrl: string): Promise<void> {
  const base = ragUrl.replace(/\/+$/, '');
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 3000);
  try {
    const res = await fetch(`${base}/health`, { signal: controller.signal });
    if (res.ok) {
      console.log(`🟢 [Shim] RAG backend reachable at ${base} (/health → ${res.status})`);
    } else {
      console.warn(`⚠️  [Shim] RAG backend at ${base} answered /health with ${res.status}.`);
    }
  } catch {
    console.warn(
      `⚠️  [Shim] RAG backend not reachable at ${base}.\n` +
        `⚠️  [Shim] Is the tunnel running?  kubectl port-forward -n default svc/kz-stage 5000:80\n` +
        `⚠️  [Shim] (questions will return 502 until it is — no restart needed once it's back)`,
    );
  } finally {
    clearTimeout(timer);
  }
}

export function createShimApp({ ragUrl, limits = {}, sendPageId = true }: ShimOptions) {
  const base = ragUrl.replace(/\/+$/, '');
  // Per-user question counter, only used when limits.maxQuestions is set.
  const questionsPerUser = new Map<string, number>();

  const app = express();
  app.use(cors());
  app.use(express.json());
  app.use((req, _res, next) => {
    console.log(`🟢 [Shim] ${req.method} ${req.url}`);
    next();
  });

  // --- status: synthesize what MediaWiki would normally inject -------------
  // Dev usually reads window.KZChatbotConfig from index.html and never calls
  // this, but it's here so the shim is usable standalone / with the launcher.
  const handleStatus = (req: Request, res: Response) => {
    const uuid = (typeof req.query.uuid === 'string' && req.query.uuid) || randomUUID();
    res.json({
      uuid,
      chatbotIsShown: true,
      questionsPermitted: limits.maxQuestions || 100,
      cookieExpiry: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString(),
    });
  };

  // --- question: lazy-mint thread_id, forward to RAG /search ---------------
  const handleQuestion = async (req: Request, res: Response) => {
    const { uuid, thread_id: threadId, referrer, ...rest } = req.body ?? {};

    if (limits.questionChars && charLen(rest.query) > limits.questionChars) {
      return res
        .status(413)
        .json({ message: `Question exceeds ${limits.questionChars} characters` });
    }

    // Reuse the client-carried thread_id, or mint one for a new thread.
    const finalThreadId =
      typeof threadId === 'string' && threadId ? threadId : mintThreadId(uuid);

    if (limits.maxQuestions) {
      const owner = uuidFromThreadId(finalThreadId) ?? (typeof uuid === 'string' ? uuid : '');
      if (owner) {
        const used = questionsPerUser.get(owner) ?? 0;
        if (used >= limits.maxQuestions) {
          return res.status(429).json({ message: 'Daily question limit reached' });
        }
        questionsPerUser.set(owner, used + 1);
      }
    }

    // asked_from and page_id are both derived from the referrer (the page id),
    // mirroring ApiKZChatbotSubmitQuestion::generateAnswer():
    //   asked_from = strval(referrer)            (always)
    //   page_id    = strval(referrer)            (when sendPageId and referrer
    //                                             is a positive-integer page id)
    const ragBody: Record<string, unknown> = {
      ...rest,
      thread_id: finalThreadId,
      asked_from: referrer != null ? String(referrer) : '',
    };
    const pageId = pageIdFromReferrer(referrer);
    if (sendPageId && pageId !== null) ragBody.page_id = pageId;
    else delete ragBody.page_id;

    try {
      const ragRes = await fetch(`${base}/search`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(ragBody),
      });
      const text = await ragRes.text();
      if (!ragRes.ok) {
        console.error(`🟢 [Shim] RAG /search ${ragRes.status}: ${text.slice(0, 500)}`);
        return res.status(502).json({ message: `RAG /search failed (${ragRes.status})` });
      }
      // Pass the RAG response through unchanged; the client's normalizeAnswer
      // reads llm_answer / conversation_id / thread_id / docs itself.
      res.type('application/json').send(text);
    } catch (err) {
      console.error('🟢 [Shim] RAG /search error:', err);
      res.status(502).json({ message: 'RAG backend unreachable' });
    }
  };

  // --- rate: forward to RAG /rating (query params, not body) ---------------
  const handleRate = async (req: Request, res: Response) => {
    const body = req.body ?? {};
    const threadId = body.thread_id;
    const conversationId = body.conversation_id ?? body.answerId;
    const { like, text } = body;

    if (limits.feedbackChars && charLen(text) > limits.feedbackChars) {
      return res.status(400).json({
        messageTranslations: { he: `המשוב ארוך מ-${limits.feedbackChars} תווים` },
      });
    }

    const params = new URLSearchParams();
    params.set('thread_id', String(threadId ?? ''));
    params.set('conversation_id', String(conversationId ?? ''));
    params.set('score', like === true ? '1' : like === false ? '0' : '');
    if (typeof text === 'string' && text) params.set('text', text);

    try {
      const ragRes = await fetch(`${base}/rating?${params.toString()}`, { method: 'POST' });
      if (!ragRes.ok) {
        const t = await ragRes.text();
        console.error(`🟢 [Shim] RAG /rating ${ragRes.status}: ${t.slice(0, 300)}`);
        return res.status(502).json({ messageTranslations: { he: 'דירוג נכשל' } });
      }
      res.json({ success: true });
    } catch (err) {
      console.error('🟢 [Shim] RAG /rating error:', err);
      res.status(502).json({ messageTranslations: { he: 'שרת ה-RAG אינו זמין' } });
    }
  };

  // Register both bare and /rest.php-prefixed routes (as mockup-server.ts does),
  // so it works whether Vite strips /api or forwards /rest.php verbatim.
  for (const prefix of ['', '/rest.php']) {
    app.get(`${prefix}${STATUS_ROUTE}`, handleStatus);
    app.post(`${prefix}${QUESTION_ROUTE}`, handleQuestion);
    app.post(`${prefix}${RATE_ROUTE}`, handleRate);
  }

  return app;
}

export async function startShimServer(
  options: ShimOptions & { port?: number },
): Promise<ShimServer> {
  const app = createShimApp(options);
  const server = http.createServer(app);
  const listenPort = options.port ?? 0;

  return new Promise((resolve) => {
    server.listen(listenPort, () => {
      const address = server.address();
      const port = address && typeof address !== 'string' ? address.port : listenPort || 3002;
      const url = `http://localhost:${port}`;

      console.log(`🟢 Shim server running at ${url}`);
      console.log(`🟢   → forwarding to RAG backend at ${options.ragUrl}`);
      console.log(`🟢   POST ${url}${QUESTION_ROUTE}`);
      console.log(`🟢   POST ${url}${RATE_ROUTE}`);
      console.log(`🟢   GET  ${url}${STATUS_ROUTE}`);

      // Fire-and-forget preflight: warn now if the RAG isn't reachable.
      void checkRagHealth(options.ragUrl);

      resolve({
        url,
        port,
        close: () =>
          new Promise<void>((res, rej) => server.close((e) => (e ? rej(e) : res()))),
      });
    });
  });
}
