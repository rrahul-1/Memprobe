# memprobe

A developer dashboard for inspecting, querying, and managing [Mem0](https://mem0.ai) memory stores. Connect your Mem0 API key and get a full-featured UI for browsing memories, testing semantic retrieval, and tracing the full history of every memory change.

**Live demo → [memprobe.vercel.app](https://memprobe.vercel.app/)**

---

<!-- SCREENSHOT: Full dashboard overview — dark UI with sidebar, memory list, and details panel open. Recommended: 1600×900 PNG. Place here as: ![Dashboard overview](./docs/screenshots/overview.png) -->

---

## Features

### Scope selector
Filter memories by any combination of `user_id`, `agent_id`, `app_id`, and `run_id`. Each selector lists all known entities from your Mem0 project — select a specific value or leave it as **all** to skip that dimension. Toggle the **all / any** switch to control whether multiple selections are combined with AND (must match all) or OR (match any).

Entity lists are paginated: scroll to the bottom of a dropdown to load the next page, or type to filter what's already loaded.

<!-- CLIP: ~5s — open a scope dropdown, type to filter, select an entity, watch the memory list reload. -->

### All Memories
Browse every memory in the current scope.

- **Live search** across memory text, IDs, and categories
- **Category filter** — click any category in the sidebar or use the toolbar dropdown
- **Sort** by most recent or oldest first
- **Infinite scroll** — next page loads automatically as you reach the bottom of the list
- **Memory detail panel** — click any memory to inspect its metadata, categories, timestamps, and raw JSON payload
- **Add Memory** — dedicated form with multi-turn messages (user / assistant roles), scope pre-fill, infer toggle, and custom metadata key-value pairs; the list refreshes automatically after a successful add
- **Refresh** — reloads entity dropdowns and the memory list without resetting your current scope selection

<!-- SCREENSHOT: All Memories view — memory selected, details panel showing metadata, categories, and raw JSON block. -->

### Retrieval Tester
Test semantic memory retrieval exactly as your agent calls it. Enter any natural language query, adjust `top_k`, and see ranked results with relevance scores and score bars. The AND / OR operator from the scope selector is applied to the search payload.

<!-- SCREENSHOT or CLIP: Query typed in, results list visible with rank numbers and score bars, one result selected in the right panel showing retrieval context. -->

### Timeline
Trace the full change history of any memory. Pick a memory from the dropdown picker, and the timeline renders a date-grouped event trail (TODAY / THIS WEEK / EARLIER) showing every `CREATED`, `UPDATED`, and `DELETED` event. For updates, the old and new memory text are shown side by side. Clicking **Timeline** in the memory detail panel pre-selects that memory automatically.

<!-- SCREENSHOT: Timeline view — a memory selected, showing a CREATED → UPDATED event trail with the before/after diff visible. -->

### Sidebar stats and categories
The left panel shows live counts (total memories, unique categories) and a clickable category list with relative frequency bars. Clicking a category filters the All Memories view instantly.

---

## Running locally

### Prerequisites

- **Node.js ≥ 18** or **Bun ≥ 1.0**
- A [Mem0 API key](https://app.mem0.ai/)

### Steps

```bash
# 1. Clone
git clone https://github.com/your-username/memprobe.git
cd memprobe

# 2. Install
bun install        # or: npm install

# 3. Start
bun run dev        # or: npm run dev
```

Open [http://localhost:3000](http://localhost:3000). On first load you'll be prompted to enter your Mem0 API key — it's stored in `localStorage` and only sent to Mem0's API. No `.env` file or server-side configuration is required.

### Building for production

```bash
bun run build
bun run start
```

---

## Tech stack

| Layer | Choice |
|---|---|
| Framework | [Next.js 16](https://nextjs.org/) — App Router |
| UI | React 19 with React Compiler (`babel-plugin-react-compiler`) |
| Styling | [Tailwind CSS v4](https://tailwindcss.com/) — PostCSS plugin |
| Mem0 | [`mem0ai` v3](https://www.npmjs.com/package/mem0ai) SDK |
| Runtime | Bun / Node.js |

All Mem0 API calls are proxied through Next.js API routes. The API key is forwarded as a request header and never stored server-side.

---

## File structure

```
memprobe/
├── src/
│   ├── app/
│   │   ├── api/                          # Next.js route handlers — Mem0 proxies
│   │   │   ├── entities/route.ts         # GET  /v1/entities            paginated entity list
│   │   │   ├── memories/
│   │   │   │   ├── route.ts              # POST /v3/memories/            list with filters + pagination
│   │   │   │   ├── search/route.ts       # POST /v3/memories/search/     semantic retrieval
│   │   │   │   ├── add/route.ts          # POST /v3/memories/add/        add from message array
│   │   │   │   └── [id]/history/         # GET  /v1/memories/:id/history full change history
│   │   │   ├── organizations/            # GET orgs, GET projects per org
│   │   │   └── validate/route.ts         # API key validation
│   │   ├── dashboard/
│   │   │   ├── page.tsx                  # Dashboard page (server component shell)
│   │   │   └── DashboardClient.tsx       # All state, effects, pagination, layout wiring
│   │   ├── globals.css                   # Design tokens, scrollbar styles, keyframes
│   │   ├── layout.tsx
│   │   └── page.tsx                      # Landing page / API key entry
│   ├── components/
│   │   └── dashboard/
│   │       ├── DashboardNavBar.tsx       # Top bar — org / project switcher
│   │       ├── Sidebar.tsx               # Left panel — scope, views, stats, categories
│   │       ├── leftPanel/
│   │       │   └── ScopeSelection.tsx    # Entity dropdown: search + infinite scroll
│   │       ├── MemoryBrowser.tsx         # All Memories middle panel
│   │       ├── RetrievalView.tsx         # Retrieval Tester middle panel
│   │       ├── TimelineView.tsx          # Timeline middle panel
│   │       ├── DetailsPanel.tsx          # Right panel — metadata, raw JSON, actions
│   │       └── AddMemoryPanel.tsx        # Right panel — add memory form
│   └── lib/
│       ├── mem0.ts                       # Authenticated fetch wrapper for Mem0 API
│       └── storage.ts                    # localStorage helpers (API key read/write)
├── public/
├── next.config.ts
└── package.json
```

---

## API route reference

Each route reads the `mem0-apiKey` header forwarded by the client, calls Mem0, and reshapes the response. No credentials are persisted.

| Route | Mem0 endpoint | Notes |
|---|---|---|
| `POST /api/memories` | `POST /v3/memories/` | Accepts `filters.AND` or `filters.OR`, `page` query param |
| `POST /api/memories/search` | `POST /v3/memories/search/` | `query`, `top_k`, `filters` |
| `POST /api/memories/add` | `POST /v3/memories/add/` | `messages`, scope fields, `infer`, `metadata` |
| `GET /api/memories/[id]/history` | `GET /v1/memories/:id/history/` | Full event log for one memory |
| `GET /api/entities` | `GET /v1/entities` | `org_id`, `project_id`, `page` — returns `has_more` |
| `GET /api/organizations` | Mem0 orgs API | Lists all orgs for the key |
| `GET /api/organizations/[id]/projects` | Mem0 projects API | Lists projects for an org |

---

## Screenshots guide

Suggested assets to capture and place in `docs/screenshots/`:

| # | File name | What to show |
|---|---|---|
| 1 | `overview.png` | Full dashboard, sidebar populated, memory list, and details panel open — 1600×900 |
| 2 | `scope-selector.gif` | Opening a dropdown, typing to filter, selecting an entity — ≤5 s |
| 3 | `all-memories.png` | Memory selected, details panel showing categories and raw JSON |
| 4 | `add-memory.gif` | Click "+ Add Memory", fill the form, click submit, list refreshes |
| 5 | `retrieval.png` | Query results with score bars, one result selected showing retrieval context |
| 6 | `timeline.png` | Memory with at least one UPDATE — before/after diff and date grouping visible |

Replace each `<!-- SCREENSHOT -->` comment above with:

```md
![Alt text](./docs/screenshots/filename.png)
```

---

## License

MIT
