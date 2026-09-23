# Router Rosetta

Translates Next.js code and questions between the **Pages Router** and the **App Router**, citing a knowledge base entry for every claim.

Paste `getServerSideProps` and it tells you this is Pages Router code, gives you the async Server Component equivalent, and cites the docs entry behind each statement. Ask "how do I read search params in each router?" and it answers for both. Every factual claim carries a citation chip — the point is that you can check the answer rather than trust it.

The model is instructed not to answer from its own memory of Next.js. If the knowledge base does not cover a mapping, it says so instead of guessing.

## Getting started

```bash
npm install
cp .env.local.example .env.local   # then fill in the values below
npm run dev
```

Open http://localhost:3000.

## Environment

The two Sanity variables are required. At least one model provider key is also
required — Groq is preferred, Google is the fallback. `.env.local` is gitignored — never commit it.

| Variable | Used by | Purpose |
| --- | --- | --- |
| `SANITY_CONTEXT_MCP_URL` | `app/api/translate/route.ts` | MCP endpoint serving the knowledge base |
| `SANITY_ORGANIZATION_TOKEN` | `app/api/translate/route.ts` | Bearer token for that endpoint |
| `GROQ_API_KEY` | `@ai-sdk/groq` | Preferred model provider. Read implicitly |
| `GOOGLE_GENERATIVE_AI_API_KEY` | `@ai-sdk/google` | Fallback provider. Read implicitly |

`NEXT_PUBLIC_SITE_URL` is optional. It sets the canonical origin for
`metadataBase`, `robots.txt` and `sitemap.xml`; on Vercel this falls back to
the deployment's production URL, and locally to `http://localhost:3000`.

If either Sanity variable is missing the route returns a configured error that the UI renders as "Not configured" rather than failing silently.

## How it works

A single client page talks to one streaming route.

```
app/page.tsx ──POST──> app/api/translate/route.ts ──> Gemini (via AI SDK)
                                                 └──> Sanity knowledge base (via MCP)
```

`route.ts` gives the model the MCP tools and a system prompt that forces an order of work: load the outline, identify the router from a specific API, read both paired entries, then answer. `stopWhen: stepCountIs(10)` bounds the tool loop.

Responses stream back as markdown and are rendered by `app/components/Markdown.tsx` — a deliberately small parser covering only what the model emits (headings, lists, fenced code, inline code, bold, citations). It returns React elements throughout, so model output cannot inject markup. Swap it for `react-markdown` if the output shape widens.

### Components

| File | Responsibility |
| --- | --- |
| `components/Markdown.tsx` | Markdown → React; citation chips colour-coded by router |
| `components/CodeBlock.tsx` | Code surface with a copy button |
| `components/ErrorNotice.tsx` | Typed errors, retry, rate-limit countdown |
| `components/ThemeToggle.tsx` | Light-default theme, persisted, applied before first paint |
| `components/useLocalRateLimit.ts` | Client-side 5-per-60s guard |
| `components/HazeField.tsx` | WebGL background field, with reduced-motion and DOM fallbacks |

### Model choice

`api/translate/model.ts` picks Groq when `GROQ_API_KEY` is set and falls back to
Google otherwise, so a deployment with only one key still works. Gemini's free
tier caps at 20 requests per day per model, which a demo exhausts quickly; Groq's
free tier is considerably larger. Override the model ids with `GROQ_MODEL` or
`GOOGLE_MODEL`.

### Caching

`api/translate/cache.ts` holds first-turn answers in memory for a day. The
example buttons send byte-identical prompts, so in a demo they would otherwise
spend most of the quota re-deriving the same answers. Only single-turn prompts
are cached — anything with history depends on turns the key does not capture.

The cache is process-local, so it empties on a cold start and is not shared
between serverless instances. It is a quota optimisation, not a source of truth.

### Rate limiting

The Gemini free tier allows a small number of requests per minute, **shared across everyone hitting a deployment**. Two layers handle it:

- **Server** — `route.ts` classifies provider errors into `RATE_LIMIT`, `AUTH`, `UPSTREAM`, `CONFIG` and `UNKNOWN`, sent to the client as `CODE|retryAfterSeconds|message`. It unwraps the AI SDK's `RetryError` to find the underlying 429 and reads Google's `retryDelay` from the response body, since no `retry-after` header is sent.
- **Client** — `useLocalRateLimit` blocks a single user from exhausting the quota before the first rejection. It cannot prevent other visitors' requests from doing so; the server classification is the real backstop.

## Design

`router-rosetta-design.md` is the source of truth for the visual system — palette, type scale, spacing rhythm, surface treatment and motion. `app/globals.css` implements it as CSS custom properties. Change the tokens there rather than hardcoding values in components.

## Scripts

```bash
npm run dev     # dev server
npm run build   # production build (also typechecks)
npm run start   # serve the production build
npm run lint    # eslint
npm test        # unit tests
```

Tests use Node's built-in runner with `tsx`, so there is no test framework to
install. `Markdown.test.tsx` covers the parser — headings, citations, code
fences, lists and escaping. Node 20's `--test` does not expand globs, so new
test files have to be added to the `test` script by name.

## Deploying

The project is configured for Vercel. Set the three environment variables above in the project settings, for every environment you deploy to.

```bash
npx vercel        # preview deployment
npx vercel --prod # production
```
