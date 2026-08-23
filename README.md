# KZChatbot — React Front-End

The chat widget for the [Kol-Zchut](https://www.kolzchut.org.il) website. It is a
small React + TypeScript app, built with Vite, that is embedded into MediaWiki
pages. Users type a question in Hebrew, the app sends it to the RAG (retrieval
augmented generation) backend, and it renders the answer plus links to the
relevant Kol-Zchut articles.

- **Repository:** `https://github.com/kolzchut/react-app-KZChatbot`
- **License:** GPL-2.0 (see [LICENSE](LICENSE))
- **Stack:** React 18, TypeScript, Vite 6, Redux Toolkit, Vitest

---

## Table of Contents

1. [Project Overview](#1-project-overview)
2. [How It Works](#2-how-it-works)
3. [Getting Started](#3-getting-started)
4. [Development Modes](#4-development-modes)
5. [Configuration Reference](#5-configuration-reference)
6. [Project Structure](#6-project-structure)
7. [Build, Release and CI/CD](#7-build-release-and-cicd)
8. [Code Clarifications](#8-code-clarifications)
9. [Repository Audit](#9-repository-audit)

> **New here?** Read [section 1](#1-project-overview), run
> [section 3.2](#32-first-run-five-minutes-no-backend), then read
> [section 7](#7-build-release-and-cicd) before you try to ship anything —
> releases are manual and there is no CI safety net.

---

## 1. Project Overview

### What this repository is

This repo contains **only the front-end**. It produces a single JavaScript
bundle (`dist/assets/index.js`) that the MediaWiki `KZChatbot` extension loads
into a wiki page. The app has no router, no server of its own, and no
authentication — it is a widget, not a website.

### Where it sits in the system

```
   Browser (a Kol-Zchut wiki page)
   ┌──────────────────────────────────────────┐
   │  MediaWiki page HTML                     │
   │  ├─ window.KZChatbotConfig  ← injected   │
   │  │    by the MediaWiki extension         │
   │  └─ <div id="kzchatbot">                 │
   │       └─ THIS APP (dist/assets/index.js) │
   └───────────────┬──────────────────────────┘
                   │  POST {restPath}/kzchatbot/v0/question
                   │  POST {restPath}/kzchatbot/v0/rate
                   ▼
   ┌──────────────────────────────────────────┐
   │  MediaWiki KZChatbot extension (PHP)     │
   │  - rate limits, banned words, page ctx   │
   └───────────────┬──────────────────────────┘
                   │  POST /search   POST /rating
                   ▼
   ┌──────────────────────────────────────────┐
   │  RAG backend (FastAPI)  →  LLM manager   │
   └──────────────────────────────────────────┘
```

Two things follow from this diagram, and they explain most of the design:

1. **The app never talks to the RAG directly in production.** It talks to
   MediaWiki, which enforces the rules (daily quota, character limits, banned
   words) and then forwards to the RAG.
2. **The app does not own its own configuration.** Everything user-visible —
   the UUID, the quota, the limits, and all the Hebrew text — arrives on
   `window.KZChatbotConfig`, which MediaWiki puts on the page. The app reads
   that object and adapts.

### Related repositories

| Repo | Role |
| --- | --- |
| `react-app-KZChatbot` (this one) | The chat widget UI |
| `mediawiki-extensions-KZChatbot` | PHP layer: injects config, enforces limits, proxies to the RAG |
| `chatbot` (in the parent workspace) | The FastAPI RAG service (`/search`, `/rating`, `/health`) |
| `chatbot-LLM-manager` | The LLM gateway that the RAG calls downstream |

---

## 2. How It Works

### 2.1 Mounting

[`src/main.tsx`](src/main.tsx) is the entry point. It does not render one app —
it mounts up to **four independent React roots**, each into a `div` that the host
page may or may not provide:

| Element id | Component | What it is |
| --- | --- | --- |
| `kzchatbot` | `Chatbot` | The full chat popover. **Created automatically** if the host page did not provide the div. |
| `chat-button` | `ChatButton` | The floating "ask our AI" button that opens the popover. |
| `chat-section` | `ChatArea` | An inline input box embedded in the middle of an article. |
| `chat-section-home` | `ChatArea isHomePage` | The same inline box, styled for the home page. |

If an element other than `kzchatbot` is missing, that mount is silently skipped
(a `console.debug` line is logged). This is intentional: an article page may
show the button but not the inline box.

All four roots share **one Redux store**, so the inline box can push a question
and the popover will pick it up and answer it.

### 2.2 The host-page contract

Before the bundle runs, the page must define `window.KZChatbotConfig`. The full
shape is in [`src/global.d.ts`](src/global.d.ts). The fields the app actually
reads are:

| Field | Used for |
| --- | --- |
| `uuid` | Identifies the anonymous user. Sent with every question. |
| `chatbotIsShown` | Hard gate — if not exactly `true`, questions are never submitted. |
| `restPath` | Base path for the REST calls **in production builds only**. Its value is `/rest.php`, the same as the dev harness uses. |
| `referrer` | The wiki page id the question was asked from. Becomes `asked_from` / `page_id` for the RAG. |
| `slugs` | Hebrew (or English) UI text. Overrides the built-in strings. |
| `questionsPermitted` | Daily quota. `0` swaps the welcome message for the "limit reached" message and hides the input. **Advisory only** — see below. |
| `questionCharacterLimit` / `feedbackCharacterLimit` | `maxLength` on the question input and the feedback textarea. |
| `termsofServiceUrl` | Link in the disclaimer footer. |
| `autoOpen` | If true, the popover opens by itself on page load. |
| `maxQuestionsPerConversation`, `conversationSessionTtlHours` | Override the defaults in [`src/config/config.json`](src/config/config.json). |

**Limits are enforced twice, on purpose.** The quota
(`questionsPermitted`), the question character limit and the feedback character
limit are all checked in this app *and* again on the MediaWiki server. The
server is the authority; the client-side checks are a second line of defence and
a better user experience (the input disables instead of the request failing).
Never treat the client-side check as the security boundary, and never remove the
server-side one because the client already covers it.

For local development, [`index.html`](index.html) fakes this object with a
hard-coded block at the top of `<head>`, surrounded by lorem-ipsum article text
so the widget can be seen in a realistic page.

### 2.3 The life of a question

```
User types → ChatInput → Footer.handleFormSubmit
   └─ dispatch(setQuestion({ text, source }))        [questionSlice]
        └─ useConversationSubmit sees the new question (useEffect)
             ├─ guard: chatbotIsShown, quota, duplicate in-flight
             ├─ dispatch(appendUserMessage)          [renders immediately]
             ├─ askQuestion() → POST /kzchatbot/v0/question
             ├─ normalizeAnswer(response)
             ├─ dispatch(setConversationThreadId)    [first turn only]
             └─ dispatch(appendBotMessage)
```

Two details worth knowing:

- **Submission is triggered by state, not by the click.** The submit handler
  only writes the question into Redux; a `useEffect` inside
  [`useConversationSubmit`](src/components/chatbot/hooks/useConversationSubmit.ts)
  watches that value and performs the request. This is why the inline `ChatArea`
  box can hand a question to the popover without calling any API itself. An
  `inFlightRef` guard stops the same text being submitted twice.
- **The API response shape is not fixed.**
  [`normalizeAnswer`](src/components/chatbot/chatbotApi.ts) accepts many
  spellings of the same fields (`answer`, `llm_answer`, `llmResult`;
  `conversation_id`, `conversationId`; nested under `data` or not) because the
  MediaWiki layer, the shim and the RAG each return a slightly different
  envelope. If you add a new backend, you probably do not need to change it.

### 2.4 Conversations, threads and turns

Three ids are in play. Mixing them up is the most common source of confusion in
this codebase:

| Id | Minted by | Lifetime | Purpose |
| --- | --- | --- | --- |
| `sessionId` | The client, per browser session | TTL hours (default 24) | Groups conversations for analytics. |
| `conversationId` (`conversation-<ts>-<uuid>`) | The client, per "new conversation" | Until history is cleared | The UI's own grouping of messages. |
| `threadId` | The **backend**, on the first question of a thread | Same as the conversation | The RAG's memory key. Sent on every later question and every rating so the RAG knows the history. |

The flow is: the client sends `thread_id: ""` on the first question; the backend
mints one and echoes it; the client stores it on the conversation
(`setConversationThreadId`) and copies it onto each bot message so a rating can
be addressed without reaching back into the store. `setConversationThreadId`
deliberately **never overwrites** an existing thread id.

Watch out for the naming collision: on the wire, `conversation_id` means
"one Q&A turn" — the backend mints a fresh one per answer. In the Redux store,
`activeConversationId` means "a whole conversation". Same word, two meanings.

### 2.5 State management

Redux Toolkit, three slices, all in [`src/store/slices/`](src/store/slices):

| Slice | Holds |
| --- | --- |
| `chatSlice` | `isChatOpen`, `isLoading`. |
| `questionSlice` | The pending question text and where it came from (`popup` / `embed`). Acts as a one-shot mailbox between components. |
| `conversationSlice` | The real data: session id/expiry, the list of conversations, which one is active, quota state, and every message. |

A conversation is archived (not deleted) when the user starts a new one, but
only if it actually contains a user question — empty conversations are
discarded. Archived messages render above a separator and are read-only.

### 2.6 Persistence and cross-tab sync

Everything in `conversationSlice` is written to `localStorage` under the key
`kzchatbot-conversation-state` on every state change.

- [`conversationSnapshot.ts`](src/lib/conversationSnapshot.ts) does the writing.
  If the browser reports a quota error it drops the **oldest archived
  conversation** and retries, in a loop, until the write succeeds or nothing is
  left to drop. It never throws — a failed save must not break the UI.
- [`sessionStorage.ts`](src/lib/sessionStorage.ts) does the reading and the
  expiry logic. On load, conversations older than the TTL are pruned; if nothing
  survives, the stored state is discarded and a fresh session begins.
- [`crossTabSyncService.ts`](src/lib/crossTabSyncService.ts) keeps multiple open
  tabs in step. It listens on both a `BroadcastChannel` and the `storage` event,
  ignores echoes of its own writes (each tab has a random `tabId`), and
  deep-compares before dispatching so unchanged data does not cause a re-render.

Cross-tab sync is a supported, working feature and is **always on** —
`initializeService` is called unconditionally in `main.tsx`. The
`enableCrossTabSync` key in `config.json` is not currently read, so there is no
supported way to switch it off.

> **`localStorage` is required, not optional.** If it is unavailable or blocked
> (private browsing, storage disabled by policy), the widget is **unsupported**
> and its behaviour is undefined — `loadConversationState` calls `JSON.parse`
> without its own `try/catch` and relies on the caller's. There is deliberately
> no in-memory fallback. Do not treat this as a bug to fix without asking first.

### 2.7 Rating

Each bot answer renders a `Rate` block: thumbs up/down plus an optional free-text
comment. [`useRate.ts`](src/lib/useRate.ts) posts to `/kzchatbot/v0/rate` with
`thread_id`, `conversation_id`, `like` and `text`.

The thumb update is **optimistic** — the message is updated in Redux first and
reverted if the request fails. Because the rating lives on the message (not in
component state) it survives a refresh and syncs across tabs.

### 2.8 Text and translations

There is no i18n library. Text resolution has three layers, in priority order:

1. `window.KZChatbotConfig.slugs` — whatever MediaWiki injected (highest).
2. `src/config/strings.he.json` or `strings.en.json`, chosen at **build time**
   by `VITE_LOCALE` (default `he`).
3. Empty string, if the key is missing everywhere.

[`src/i18n/index.ts`](src/i18n/index.ts) merges layers 1 and 2 once;
`TranslationProvider` puts the result in context; components call
`const { t } = useTranslation()`. [`src/i18n/types.ts`](src/i18n/types.ts) lists
every valid key, so a typo is a compile error.

Only keys listed in `FORMATTED_SLUGS` (currently just `welcome_message`) allow
limited formatting — `**bold**` and newlines. `formatAdminString` escapes the
HTML first, then converts those two things, so admin-supplied text cannot inject
markup. Bot answers are different: they are rendered as full Markdown through
`react-markdown` + `remark-gfm`, which is how the answer tables show up.

**Every build contains both languages.** `src/i18n/index.ts` statically imports
both JSON files into one lookup object, so nothing is tree-shaken away —
`VITE_LOCALE` only decides which of the two is the *default*. Since MediaWiki
injects `slugs` in production and those win, the baked-in locale is in practice
just a fallback for keys MediaWiki did not supply. See
[section 7.4](#74-locale-builds) for what this means at release time.

### 2.9 Analytics

[`pushAnalyticsEvent`](src/lib/analytics.ts) pushes objects onto
`window.dataLayer` (Google Tag Manager). Every event is named
`chatbot_<action>`. Tracked actions include `opened`, `question_asked`,
`answer_received`, `error_received`, `positive_feedback`, `negative_feedback`,
`link_clicked`, `closed_unused`, `quota_reached`, `new_conversation_clicked`,
`history_deleted_requested`, `history_deleted_confirmed`.

Conversation events carry a payload built by
[`createConversationPayload`](src/components/chatbot/chatbotAnalytics.ts):
`session_id`, `conversation_id`, `question_index_in_conversation`,
`max_questions`, `source`.

### 2.10 Styling — read this before touching CSS

> **This project looks like it uses Tailwind. It does not.**

`tailwindcss` is in `package.json` and in `postcss.config.js`, but there is **no
`tailwind.config.js`**, so Tailwind scans nothing and generates nothing. (Any
build prints a "content option is missing or empty" warning — that warning is
expected.) What actually exists is
[`src/styles/base.css`](src/styles/base.css): a hand-copied Tailwind preflight,
scoped under `.kzchatbot` so it cannot leak into the surrounding MediaWiki page.
Utility-looking class names in the JSX are hand-written in the component CSS
files.

**Practical consequence:** adding a class like `mt-4` will do nothing. Write a
real rule in the component's own `.css` file, and prefer the CSS variables
defined at the top of [`src/index.css`](src/index.css) (`--kzcb-*`) over raw hex
values.

### 2.11 The production build

[`vite.config.ts`](vite.config.ts) sets two unusual options, both because the
bundle is loaded by MediaWiki from an extension path rather than the site root:

- `format: "iife"` and fixed file names — one predictable, self-contained script.
- `assetsInlineLimit: 16384` — every SVG and font is inlined as a data URI. An
  emitted `assets/foo.svg` would be requested from the *site* root and 404. If
  you add an asset larger than 16 KB, raise this number or the build will break
  in production while still looking fine locally.

### 2.12 Accessibility

**The required standard is WCAG 2.1 level AA, as a minimum.** Treat this as a
hard acceptance criterion for any UI change, not a nice-to-have.

What the code already does:

- Bot message containers are `aria-live="polite"`, so answers are announced as
  they arrive.
- Decorative icons (`Stars`, `LinkIcon`, `AlertIcon`, the send arrow) use
  `alt=""` with `aria-hidden="true"`, so they are skipped by screen readers.
- The popover is wired with `labelledById="kzcb-dialog-title"`.
- Answer links carry `target="_blank"` with `rel="noreferrer"`.
- The layout is right-to-left for Hebrew.

What is **not** in place: no automated accessibility checks run anywhere (there
is no CI at all — see [section 7](#7-build-release-and-cicd)), and there is no
recorded manual audit against AA. Colour contrast in particular is worth
checking, since the palette is a set of raw hex values in
[`src/index.css`](src/index.css). If you touch colours, focus states, keyboard
order or ARIA attributes, verify AA yourself before handing the change over.

---

## 3. Getting Started

### 3.1 Prerequisites

| Tool | Version | Notes |
| --- | --- | --- |
| Node.js | 20 LTS or newer | Vite 6 requires 18+; the repo is developed on 20/22/24. |
| npm | 10 or newer | Ships with Node 20+. `package-lock.json` is committed, so use npm rather than yarn/pnpm. |
| Git | any | |
| `kubectl` | any | **Only** for shim mode against the staging RAG. |

You do **not** need MediaWiki, PHP, a database, or Python to develop the UI.

### 3.2 First run (five minutes, no backend)

```bash
git clone https://github.com/kolzchut/react-app-KZChatbot.git
```

```bash
cd react-app-KZChatbot && npm install
```

```bash
npm run dev:mock
```

Open the URL Vite prints (usually `http://localhost:5173`). You should see a
lorem-ipsum article with the chat button. Ask anything — a canned Hebrew answer
comes back after a short artificial delay.

This works with no `.env` file at all, because mockup mode ignores
`VITE_API_URL`.

### 3.3 Setting up `.env`

Copy the example and fill it in:

```bash
cp .env.example .env
```

`.env` is git-ignored — never commit it. **Do not put credentials in this
README, in `.env.example`, or in any tracked file.** Backend URLs, cluster
access and any shared secrets are documented in the internal handover document:
[מסמך חפיפה פנימי - כל זכות](https://docs.google.com/document/d/1Vw99KJXy1Cj2etQohB_2PE_puBszK8rSWG8kc9C_HBA).

### 3.4 Everyday commands

| Command | What it does |
| --- | --- |
| `npm run dev` | Dev server, proxying `/api` to `VITE_API_URL` (a real MediaWiki). |
| `npm run dev:mock` | Dev server with canned answers. No backend needed. |
| `npm run dev:shim` | Dev server against a real RAG, no MediaWiki. |
| `npm run shim` | Runs the shim alone on port 3002. |
| `npm run build` | Type-check (`tsc -b`) then build to `dist/`. Hebrew by default. |
| `npm run build:he` / `build:en` | Same, with the locale pinned explicitly. |
| `npm run preview` | Serve the built `dist/` locally. |
| `npm test` | Vitest in watch mode. |
| `npm run test:run` | Vitest once (use this in CI). |
| `npm run test:coverage` | Coverage report. |
| `npm run test:ui` | Vitest browser UI. |
| `npm run lint` | ESLint over `src/`. |

**Current state of these commands** (verified while writing this document):

- `npm run test:run` — **passes**: 15 files, 161 tests.
- `npm run lint` — **fails**. There is one warning
  (`react-hooks/exhaustive-deps` in
  [Footer.tsx:55](src/components/chatbot/footer/Footer.tsx:55)) and the script
  runs with `--max-warnings 0`, so it exits non-zero. Fix the dependency array
  or adjust the threshold before wiring lint into CI.

### 3.5 Testing

Vitest + React Testing Library + jsdom. Tests live in two places by convention:
co-located `__tests__` folders next to the code they cover, and
[`src/tests/`](src/tests) for cross-component integration tests. Global mocks
(`window.dataLayer`, `window.KZChatbotConfig`, `fetch`) are set up in
[`src/tests/setup.ts`](src/tests/setup.ts). See
[src/tests/README.md](src/tests/README.md) for the analytics test suite in
detail — but note the caveats in [section 9](#9-repository-audit).

---

## 4. Development Modes

`VITE_MODE` selects which backend the dev server talks to. All three modes serve
the same UI.

| Mode | Command | Backend | Use when |
| --- | --- | --- | --- |
| **Mockup** | `npm run dev:mock` | None — canned responses | UI work; no backend available |
| **Shim** | `npm run dev:shim` | A real RAG, no MediaWiki | Testing the genuine RAG pipeline |
| **Normal** | `npm run dev` | `VITE_API_URL` (real MediaWiki) | Full-stack testing |

In mockup and shim mode Vite starts the backend **in its own process** and shuts
it down with itself — there is no second terminal to manage. A coloured banner in
the browser console tells you which mode is live.

Both have their own detailed guides:

- [README-mockup-mode.md](README-mockup-mode.md)
- [README-shim-mode.md](README-shim-mode.md) — includes the
  `kubectl port-forward` command for reaching the staging RAG.

### How the request path differs between dev and production

This trips people up, so it is worth stating plainly:

- **Development** (`import.meta.env.MODE !== 'production'`): the app calls
  `/api/kzchatbot/v0/question`. Vite's proxy strips `/api` and forwards to
  whichever backend is active.
- **Production**: the app calls `${config.restPath}/kzchatbot/v0/question`,
  using the path MediaWiki injected. No proxy is involved.

The check is a literal `import.meta.env.MODE === 'production'` in
[`chatbotApi.ts`](src/components/chatbot/chatbotApi.ts) and
[`useRate.ts`](src/lib/useRate.ts).

---

## 5. Configuration Reference

### 5.1 Environment variables

| Variable | Default | Where used | Purpose |
| --- | --- | --- | --- |
| `VITE_API_URL` | — | `vite.config.ts` | Proxy target in normal `dev` mode. |
| `VITE_MODE` | unset | `vite.config.ts` | `mockup`, `shim`, or unset. Set for you by the `dev:mock` / `dev:shim` scripts. |
| `VITE_LOCALE` | `he` | `src/i18n/index.ts` | Build-time locale. `he` or `en`. |
| `RAG_API_URL` | `http://localhost:5000` | shim | Base URL of the RAG backend. |
| `SHIM_PORT` | `3002` | shim (standalone only) | Listen port. |
| `SHIM_SEND_PAGE_ID` | `true` | shim | Send `page_id` derived from the referrer. |
| `SHIM_MAX_QUESTIONS` | `0` (off) | shim | Per-user question cap → HTTP 429. Used to test the quota UI. |
| `SHIM_QUESTION_CHARS` | `0` (off) | shim | Question length cap → HTTP 413. |
| `SHIM_FEEDBACK_CHARS` | `0` (off) | shim | Feedback length cap → HTTP 400. |

Only `VITE_*` variables reach the browser. The `SHIM_*` and `RAG_API_URL`
variables are read by Node and never shipped to the client.

### 5.2 Application defaults

[`src/config/config.json`](src/config/config.json) holds the values used when
`window.KZChatbotConfig` does not override them:

| Key | Default | Meaning |
| --- | --- | --- |
| `defaultLocale` | `he` | Fallback locale. |
| `storageKeys.conversationState` | `kzchatbot-conversation-state` | The `localStorage` key. |
| `defaults.conversationSessionTtlHours` | `24` | How long conversations survive. |
| `defaults.maxQuestionsPerConversation` | `8` | Questions before the "start a new conversation" prompt. |
| `defaults.enableCrossTabSync` | `true` | **Currently not read by any code** — see [section 9](#9-repository-audit). |

---

## 6. Project Structure

```
react-app-KZChatbot/
├─ index.html               Dev host page — fakes window.KZChatbotConfig
├─ vite.config.ts           Build config + dev-backend wiring + proxy
├─ mockup-server.ts         Canned-response dev backend
├─ shim-server.ts           Dev backend that forwards to a real RAG
├─ shim-standalone.ts       Runs shim-server.ts as its own process
└─ src/
   ├─ main.tsx              Entry point — mounts the four React roots
   ├─ types.ts              Message / Answer / MessageType shared types
   ├─ global.d.ts           The window.KZChatbotConfig contract
   ├─ index.css             CSS variables + global widget styles
   ├─ assets/               SVG icons (inlined at build time)
   ├─ config/               config.json + strings.he.json / strings.en.json
   ├─ i18n/                 String resolution and the key type
   ├─ contexts/             TranslationProvider and its hook
   ├─ hooks/                useTranslation, useChatDescription
   ├─ lib/                  analytics, storage, cross-tab sync, useRate, utils
   ├─ store/                Redux store and the three slices
   ├─ styles/base.css       Scoped CSS reset (the Tailwind-preflight copy)
   ├─ mockFollowUp/         DEMO-ONLY scripted follow-up (see section 7)
   ├─ tests/                Integration tests + global test setup
   └─ components/
      ├─ chatButton/        The floating open button
      ├─ chatArea/          The inline in-article input box
      ├─ chatbot/           The popover: messages, input, footer, rating, modals
      └─ ui/                Generic Input and Popover primitives
```

---

## 7. Build, Release and CI/CD

### 7.1 Current state: there is no CI and no CD

This is the single most important thing to know before you ship anything.

| | Status |
| --- | --- |
| Continuous integration | **None.** |
| Continuous delivery / deployment | **None.** |
| Automated tests on push or PR | **None.** |
| Automated lint on push or PR | **None.** |
| Automated build on push or PR | **None.** |
| Release tags / versioning | **None** — `package.json` is `0.0.0`, no git tags exist. |
| Container image | **None** — there is no `Dockerfile`. |

Verified: the repository contains no `.github/workflows/`, and no GitLab,
Jenkins, CircleCI, Travis, Azure Pipelines, Drone or Bitbucket configuration —
neither on any branch nor anywhere in the git history. The Helm chart in the
parent workspace (`infra/`) deploys the **backend only** (the RAG service, the
LLM manager, Redis and the Telegram gateway). It contains nothing for this
front-end.

**Consequence:** nothing but a human stops a broken commit reaching production.
Every check in [section 7.3](#73-pre-handoff-checklist) is one you must run
yourself.

### 7.2 How a change actually reaches production

The release path is a manual, person-to-person handoff:

```
  You                                     Dror (Kol-Zchut developer)
  ───                                     ──────────────────────────
  1. branch off main
  2. implement + test locally
  3. run the checklist (7.3)  ← the ONLY gate that exists
  4. open a PR on GitHub
  5. review + merge to main
                          │
                          └──►  6. takes the code from this repo and
                                   implements the integration himself
                                   inside the MediaWiki KZChatbot extension
                                          │
                                          └──►  7. MediaWiki serves the bundle
                                                   and injects
                                                   window.KZChatbotConfig
```

Points that follow from this, and that regularly surprise people:

- **This repo is a source handoff, not a deployment artefact.** Merging to
  `main` does not deploy anything. Nothing in this repository publishes,
  uploads, or releases.
- **The integration is owned outside this repo.** The MediaWiki side —
  building the bundle into the extension, injecting `window.KZChatbotConfig`,
  enforcing quotas and banned words — is Dror's, in
  `mediawiki-extensions-KZChatbot`. If the widget misbehaves in production but
  is fine in shim mode, the cause is very often on that side.
- **`main` is the source of truth.** Feature branches such as `Mock` are not;
  see [section 8.1](#81-srcmockfollowup-is-demo-code-not-a-feature).
- **There is no rollback button.** Reverting means a new commit on `main` and
  another handoff.

### 7.3 Pre-handoff checklist

Because there is no automated gate, run all of this locally before opening a PR:

```bash
npm ci
```

```bash
npm run test:run
```

```bash
npm run lint
```

```bash
npm run build
```

Then check by hand:

- [ ] `npm run dev:mock` still renders and answers.
- [ ] `npm run dev:shim` works against a real RAG (this is the closest thing to
      a staging test the front-end has).
- [ ] The change meets WCAG 2.1 AA — see [section 2.12](#212-accessibility).
- [ ] No new asset exceeds the 16 KB inline limit
      (see [section 2.11](#211-the-production-build)).
- [ ] No secrets, tokens or internal URLs are in the diff, and `.env` is not
      staged.
- [ ] Any new environment variable is added to `.env.example` **and** to
      [section 5.1](#51-environment-variables).
- [ ] Nothing from `src/mockFollowUp/` is being carried into `main`.

> `npm run lint` currently exits non-zero on a clean checkout — see
> [section 9](#9-repository-audit). Confirm you have not *added* warnings rather
> than expecting a clean pass.

### 7.4 Locale builds

`VITE_LOCALE` is inlined at build time and picks the **default** string set.
Both `strings.he.json` and `strings.en.json` ship in every bundle regardless
(see [section 2.8](#28-text-and-translations)), and MediaWiki's injected `slugs`
override both at runtime.

| Command | Baked-in default |
| --- | --- |
| `npm run build` | Whatever `VITE_LOCALE` is in `.env`, else `he` |
| `npm run build:he` | `he` |
| `npm run build:en` | `en` |

> **Fixed in this repo — worth knowing if you see an older checkout.** These
> scripts used to read `cross-env VITE_LOCALE=en tsc -b && vite build`.
> `cross-env` only applies to the command it wraps, so the variable reached
> `tsc -b` (which ignores it) and *not* `vite build`. `npm run build:en`
> therefore silently produced a **Hebrew** bundle, falling back to `.env`. The
> scripts are now `tsc -b && cross-env VITE_LOCALE=en vite build`, which is
> correct. Verified by inspecting the inlined literal in the emitted bundle.

Because MediaWiki supplies the real strings anyway, this mostly affects which
text appears for keys MediaWiki did not inject.

### 7.5 What to hand over

`npm run build` emits a single self-contained file:

```
dist/assets/index.js     one IIFE bundle, all SVGs/fonts inlined as data URIs
dist/index.html          the dev harness — NOT used in production
```

Only `dist/assets/index.js` matters downstream. `dist/` is git-ignored, so it is
built fresh rather than committed. There is no fingerprint or hash in the
filename, which is why [section 7.6](#76-recommended-next-steps) puts version
traceability first.

### 7.6 Recommended next steps

None of this exists yet. Listed roughly in order of value:

1. **Make releases traceable.** Right now nothing identifies which commit is
   live: the version is `0.0.0`, there are no tags, and the bundle filename is
   constant. Adopt real versions, tag each handoff, and consider stamping the
   commit SHA into the bundle via `define`.
2. **Add CI.** A minimal workflow would catch most regressions. Save as
   `.github/workflows/ci.yml`:

   ```yaml
   name: CI
   on:
     push:
       branches: [main]
     pull_request:
   jobs:
     verify:
       runs-on: ubuntu-latest
       steps:
         - uses: actions/checkout@v4
         - uses: actions/setup-node@v4
           with:
             node-version: '20'
             cache: npm
         - run: npm ci
         - run: npm run lint
         - run: npm run test:run
         - run: npm run build
   ```

   **Before enabling this, fix the existing lint warning** — otherwise the very
   first run is red. See [section 9](#9-repository-audit).
3. **Publish the build as a CI artifact** on tagged commits, so the handoff is a
   downloadable, versioned file rather than a local build.
4. **Pin the Node version** with `.nvmrc` and an `engines` field, so CI and
   every developer agree.
5. **Add automated accessibility checks** (`axe-core`/`jest-axe` in the Vitest
   suite) given the AA requirement.

---

## 8. Code Clarifications

Points that are genuinely confusing when reading the code for the first time.

### 8.1 `src/mockFollowUp/` is demo code, not a feature

Every file in this folder starts with a `MOCK PATCH` comment, and its call sites
in [`useConversationSubmit.ts`](src/components/chatbot/hooks/useConversationSubmit.ts)
and [`Footer.tsx`](src/components/chatbot/footer/Footer.tsx) are wrapped in
`// MOCK PATCH START` / `// MOCK PATCH END` markers.

What it does: if a user's question contains one of two hard-coded Hebrew phrases
(`סל שיקום`, `נכות של 42%`), the app appends a scripted follow-up offer. If the
user then replies with the word `כן` ("yes"), it asks which region, and any
answer to that produces a fixed list of `kolsherut.org.il` links. **These two
turns never reach the backend.**

This exists for a demo and is **confined to the `Mock` branch**. Verified:
`origin/main` contains no `src/mockFollowUp/` and no `MOCK PATCH` markers, so
there is nothing to strip out of the production branch. The only files that
differ between `main` and `Mock` are the four `mockFollowUp` files plus
`index.html`, `Footer.tsx`, `useConversationSubmit.ts` and `types.ts`.

If you ever need to remove it from a branch that does carry it: delete
`src/mockFollowUp/`, remove the blocks between the `MOCK PATCH` markers, and
drop the `MockFollowUpScenario` / `MockFollowUpTurn` types from
[`src/types.ts`](src/types.ts).

### 8.2 `setMessages` is not React state

`Messages`, `MessageBlock`, `Rate` and `useRate` all take a `setMessages` prop
typed as `React.Dispatch<React.SetStateAction<Message[]>>`, which looks like
`useState`. It is not. In
[`Chatbot.tsx`](src/components/chatbot/Chatbot.tsx) it is a shim that resolves
the updater against the active conversation and dispatches
`replaceActiveMessages` to Redux. The `useState`-shaped signature was kept so
the components did not have to change when the app moved to Redux.

### 8.3 `useConversationSubmit` fires from an effect, not from the submit handler

There is no `onSubmit → fetch` line anywhere. Submitting writes to
`questionSlice`; an effect reacts to that value. If you are looking for "where
does the question get sent", it is the `useEffect` at the bottom of
[`useConversationSubmit.ts`](src/components/chatbot/hooks/useConversationSubmit.ts).

### 8.4 `hasConversation` in `useChatDescription`

It compares `item.type === 'user'` against a raw string rather than
`MessageType.User`. The values match, so it works, but it bypasses the enum and
would not be caught by a rename.

### 8.5 `renderQuotaMessage` searches translated text

To make "start a new conversation" clickable inside the quota message,
[`MessageBlock.tsx`](src/components/chatbot/messages/MessageBlock.tsx) does
`message.content.lastIndexOf(newConversationText)` and splits the string around
the match. If the `quota_reached_message` slug is reworded so it no longer
contains the exact `new_conversation_button` text, the button is appended at the
end instead. It degrades gracefully, but it is string-matching translated
content — treat those two slugs as coupled.

### 8.6 Names that mean different things in different places

| Name | In the store | On the wire |
| --- | --- | --- |
| `conversationId` | A whole conversation (many turns) | One Q&A turn |
| `threadId` | The conversation's backend memory key | Same |
| `referrer` | Not stored | The wiki page id; becomes `asked_from` / `page_id` |

### 8.7 `src/i18n/strings.he.ts` and `strings.en.ts` are dead files

Both are four-line re-exports of the matching JSON, and nothing imports them —
`src/i18n/index.ts` imports the JSON directly. They can be deleted.

---

## 9. Repository Audit

Findings from reviewing the repo against normal project hygiene. None of these
block development; they are listed so they can be picked up deliberately.

### Already resolved

Fixed while producing this document:

| Item | What changed |
| --- | --- |
| `build:he` / `build:en` produced the wrong locale | `cross-env` was scoped to `tsc -b` instead of `vite build`, so the locale never reached the bundle. Scripts corrected in `package.json`; verified against the emitted bundle. See [7.4](#74-locale-builds). |
| `historyStorageMode` dead type field | Confirmed unused everywhere (introduced in a `WIP` commit, never read) and removed from [`global.d.ts`](src/global.d.ts). `tsc -b` and all 161 tests still pass. |
| `.env.example` incomplete | Rewritten to document all nine variables — `VITE_API_URL`, `VITE_LOCALE`, `VITE_MODE`, `RAG_API_URL`, `SHIM_PORT`, `SHIM_SEND_PAGE_ID`, `SHIM_MAX_QUESTIONS`, `SHIM_QUESTION_CHARS`, `SHIM_FEEDBACK_CHARS` — with comments and safe placeholders. |

> **These fixes still need to reach `main`.** They were made on the `Mock`
> branch. Verified against `origin/main`: it still has the miscoped `cross-env`
> in `build:he` / `build:en`, still declares `historyStorageMode`, and still has
> the two-variable `.env.example`. Since `main` is the source of truth and
> `Mock` is not, these three changes — plus this README — must be reapplied on
> top of `main`, ideally as one small PR.

### Accepted as-is

Reviewed and deliberately left alone. Do not "fix" these without asking:

| Item | Decision |
| --- | --- |
| Tailwind is installed but has no config | **Keep as is.** The dependency, the PostCSS plugin and the `components.json` reference all stay, even though no utilities are generated. See [2.10](#210-styling--read-this-before-touching-css). |
| `/kzchatbot/v0/status` is never called by the client | **Keep.** The shim continues to implement it. |
| No graceful degradation without `localStorage` | **Keep.** Explicitly **unsupported** — see [2.6](#26-persistence-and-cross-tab-sync). |
| The `Mock` branch | Not production. `main` is the source of truth. |

### Missing files

| File | Status | Why it matters |
| --- | --- | --- |
| `CONTRIBUTING.md` | **Missing** | No documented branch naming, commit convention, PR checklist, or review process. The pre-handoff checklist in [7.3](#73-pre-handoff-checklist) is the closest substitute. |
| `.github/workflows/` | **Missing** | No CI at all. Nothing runs `test:run`, `lint`, or `build` on a pull request. A ready-to-use workflow is in [7.6](#76-recommended-next-steps). |
| `CHANGELOG.md` + version/tags | **Missing** | `package.json` is pinned at `version: 0.0.0` and there are no git tags, so nothing identifies which commit MediaWiki is serving. Highest-value gap given the manual handoff. |
| `.nvmrc` / `engines` | **Missing** | The Node version is not pinned anywhere. |
| `Dockerfile` | **Absent by design** | Not needed — the output is a static bundle handed to MediaWiki, not a deployed service. |

### Code and configuration issues

1. **`npm run lint` currently fails.** One `react-hooks/exhaustive-deps` warning
   in [Footer.tsx:55](src/components/chatbot/footer/Footer.tsx:55) against
   `--max-warnings 0`. This blocks adding CI until it is resolved — either fix
   the dependency array or raise the threshold deliberately.
2. **Unused config fields.** `enableCrossTabSync`, `cookieExpiry` and
   `usageHelpUrl` are declared in [`global.d.ts`](src/global.d.ts) (and
   `enableCrossTabSync` also in `config.json`) but read nowhere. Cross-tab sync
   itself works correctly and is always on — the flag simply has no effect, so
   there is no supported way to disable it.
3. **`index.html`'s fake config has drifted.** It sets
   `welcome_message_first` / `_second` / `_third`, which are not keys in
   `ChatbotStrings`; the real key is `welcome_message`. It also passes
   `referrer` as a number while the type says `string`, and omits `autoOpen`,
   `chat_description_when_active_conversation`, and the delete-history slugs — so
   several UI strings render empty in local dev.
4. **`src/tests/README.md` is out of date.** It documents
   `analytics-integration.test.tsx` (the file is
   `analytics-integration-simple.test.tsx`), and its examples pass the third
   argument to `pushAnalyticsEvent` as a string when the real signature takes a
   payload object.
5. **The `/kzchatbot/v0/status` endpoint is never called.** The shim implements
   it; the client only ever reads `window.KZChatbotConfig`.
6. **`HttpError`'s constructor calls `console.log(message)`.** Every error is
   logged from the constructor, including in production.
7. **`useRate.ts` reads `data.messageTranslations.he` with no guard**, next to a
   `// TODO: add type for data` comment. If the backend returns an error body
   without that shape, the error handler itself throws.
8. **Hard-coded fallbacks bypass config.** `questionCharacterLimit` and
   `feedbackCharacterLimit` fall back to `150` inline in `Footer.tsx`,
   `ChatInput.tsx` and `useRate.ts` rather than coming from `config.json`.
9. **Files over 100 lines.** `useRate.ts` (182), `Rate.tsx` (137),
   `Footer.tsx` (131), `useConversationSubmit.ts` (125), `MessageBlock.tsx`
   (122), `Chatbot.tsx` (121), `useConversationSession.ts` (107). Worth
   splitting if the house style limit is being enforced.
10. **`dist/` and `.node-tsbuild/` are present in the working tree.** Both are
    git-ignored, but stale local copies can confuse `npm run preview`.
