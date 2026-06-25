# Shim Mode (middleware shim)

Shim mode lets you run the chatbot UI against a **real RAG backend** without
MediaWiki/PHP/DB. A small Node "middleware shim" stands in for the KZChatbot
MediaWiki layer: it speaks the same REST contract the React app expects
(`/kzchatbot/v0/{status,question,rate}`) and forwards to the RAG's
`POST /search` / `POST /rating`.

How it compares to the two other dev backends:

| Mode | Command | Backend | Use when |
| --- | --- | --- | --- |
| Mockup | `npm run dev:mock` | none (canned responses) | developing UI with no backend at all |
| **Shim** | `npm run dev:shim` | **real RAG** (no MediaWiki) | testing the genuine RAG pipeline without MediaWiki |
| Normal | `npm run dev` | `VITE_API_URL` (real MediaWiki) | full stack |

## Identity model (continuous conversation)

- **`thread_id`** — the durable, multi-turn thread (the RAG's redis key). The
  shim **mints** it on the first question of a thread as `${uuid}:${uuidv4()}`.
  The `uuid` prefix namespaces the thread per user (so a guessed thread part
  can't reach another user's history) and the random part makes it unguessable.
  The client then **carries** this `thread_id` for every later turn and rating.
- **`conversation_id`** — a single Q&A turn; the RAG mints one per `/search`.

The client sends its `uuid` (from `window.KZChatbotConfig`, mocked in
`index.html` for dev) and an empty `thread_id` on a new thread; the shim mints,
the RAG echoes it back, and the client adopts it.

## Page context (`asked_from` / `page_id`)

The client sends `referrer` (the page id, from `window.KZChatbotConfig.referrer`).
The shim derives both RAG fields from it, mirroring
`ApiKZChatbotSubmitQuestion::generateAnswer()`:

- `asked_from = String(referrer)` — always.
- `page_id = String(referrer)` — only when `SHIM_SEND_PAGE_ID` is on (default)
  and the referrer is a positive-integer page id. (The MediaWiki layer also
  checks `ChatbotRagContent` title relevance, which the shim can't replicate, so
  any positive-integer referrer is treated as a page id here.)

## Connecting to the RAG backend

Set `RAG_API_URL` to the RAG base URL (default `http://localhost:5000`).

The staging RAG runs in AKS as the `kz-stage` service (the FastAPI `chatbot`
image; the `llm-manager-stage` service is the downstream LLM gateway, **not**
the RAG). You don't need to reach its IP directly — tunnel through the cluster
API server with your existing kubeconfig:

```bash
kubectl port-forward -n default svc/kz-stage 5000:80
```

Then in another terminal:

```bash
RAG_API_URL=http://localhost:5000 npm run dev:shim
```

## Two ways to run

### In-process (recommended)

Vite starts the shim automatically and proxies to it — a single config, no
extra terminal:

```bash
RAG_API_URL=http://localhost:5000 npm run dev:shim
```

### Standalone

Run the shim as its own process (survives Vite restarts; usable from Playwright,
curl, MediaWiki-less e2e, etc.):

```bash
RAG_API_URL=http://localhost:5000 npm run shim   # listens on :3002 by default
```

## Configuration

Set via `.env` or inline. `VITE_MODE=shim` selects the mode (set for you by the
`dev:shim` script).

| Env | Default | Purpose |
| --- | --- | --- |
| `RAG_API_URL` | `http://localhost:5000` | RAG backend base URL |
| `SHIM_PORT` | `3002` | standalone listen port (ignored in-process) |
| `SHIM_SEND_PAGE_ID` | `true` | send `page_id` (from referrer) to the RAG; set `false` to disable (mirrors `KZChatbotSendPageId`) |
| `SHIM_MAX_QUESTIONS` | `0` (off) | per-user question cap → `429` (tests the daily-limit UI) |
| `SHIM_QUESTION_CHARS` | `0` (off) | question character limit → `413` |
| `SHIM_FEEDBACK_CHARS` | `0` (off) | feedback character limit → `400` |

By default all limits are off — the shim is a thin passthrough.

## Debugging

The shim logs every request (`🟢 [Shim] …`) and any RAG error in the terminal.
In the browser console you'll see a `SHIM MODE ACTIVE` banner.

The shim is implemented in `shim-server.ts` (the app + forwarding logic) and
`shim-standalone.ts` (the standalone entry point).
