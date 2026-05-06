# Marketing HQ — Local Dashboard

Personal marketing strategist + content ops dashboard for the AI in Business channel.

## Run it

```bash
npm run dashboard
```

Opens http://localhost:5173 in your browser. Server is local-only (not exposed to internet).

Stop it: `Ctrl+C` in the terminal.

## What's where (sidebar)

| Page | URL | What it does |
|------|-----|--------------|
| **Today** | `/today` | Today's mode (post / engage / ideate / rest), the one-thing-to-do CTA, posting playbook for the current day. |
| **Queue** | `/queue` | All rendered + approved videos waiting to upload. Click any → see captions per platform with copy buttons + mark-posted form. |
| **Uploaded** | `/uploaded` | Posts that went live across all 3 platforms, with their URLs. |
| **Calendar** | `/calendar` | 14-day strategic plan. Add/remove drops. Posting windows per platform. |
| **Performance** | `/performance` | Log views/likes/saves at 24h / 7d / 30d. See top performers. |
| **Ideas** | `/ideas` | Topic backlog. Add quickly when an idea hits. Mark done when shipped. |
| **Hooks** | `/hooks` | Reusable hook templates. Copy → swap brackets per video. |

## File layout

```
dashboard/
├── server.mjs              ← Express bootstrap
├── routes/                 ← URL handlers (one file per section)
├── views/                  ← HTML templates (one file per section)
├── lib/                    ← store, kit-parser, helpers (no Express in here)
├── public/                 ← styles.css + app.js
└── data/                   ← JSON state on disk (ideas, hooks, plan, performance)
```

## How it reads your videos

The dashboard reads from `out/final/queue/` and `out/final/uploaded/` — the same folders the publishing scripts use. **No double entry.**

For a video to show up in the Queue:
- `out/final/queue/<topic>-final.mp4` exists
- `out/final/queue/<topic>-publishing-kit.md` exists with sections `## YouTube Shorts`, `## Instagram Reels`, `## LinkedIn`

When you mark all 3 platforms as posted, the files automatically move to `out/final/uploaded/<topic>/`.

## Adding a new section (extending the dashboard)

1. Make a view: `views/foo.mjs` exporting `fooView({...})` that returns HTML
2. Make a route: `routes/foo.mjs` exporting `fooRoutes(app)` that mounts `app.get('/foo', ...)`
3. Register in `routes/index.mjs`
4. Add nav entry in `views/_layout.mjs` (the `NAV` array)

That's it. No build step. No bundler.

## Data lives in plain JSON

`dashboard/data/*.json` — readable, editable, gitignore-able. If something looks wrong, open the file and fix it.

## Keyboard

- `R` → reload current page (handy when you've added a video to queue from another window)
