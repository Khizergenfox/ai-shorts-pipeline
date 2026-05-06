
---
name: Daily AI Shorts
description: A Claude Code skill for anyone whose calendar is full but whose audience still expects to hear from them. Automates the production of daily 60-second vertical videos — voiceover, scene composition, B-roll, optional avatar, captions — so consistency stops being a tax. Ready to post on YouTube Shorts, Instagram Reels, LinkedIn, and X.
type: skill
license: MIT
status: active
---

# Daily AI Shorts

> For anyone whose calendar is full but whose audience still expects to hear from them.
>
> Daily content is now a tax on every operator, founder, and builder trying to grow a name. Most days you don't have an hour to record, edit, caption, and post. This skill automates the production so you can keep showing up — even on the days you can't. The point is **consistency** for the people whose real job isn't creating content but who still need to.
>
> Drop this skill into Claude Code. Give it a topic and a few sources. It hands you back a finished 9:16 video, a voiceover, and per-platform captions. No editor. No camera. Around 5–7 minutes per video on a normal laptop.
>
> Battle-tested on [@AIinBusiness](https://youtube.com/@AIinBusiness) — daily videos rendered by this exact pipeline.

---

## What this skill does

When you give Claude a topic and a few links, it:

1. Drafts a 60-second narration script
2. Generates voiceover via ElevenLabs
3. Aligns word-level timestamps against the audio
4. Composes scenes via Remotion (real screenshots, native UI mockups, Three.js, Veo b-roll)
5. Renders the final 1080×1920 MP4
6. Writes platform-specific captions for YouTube, Instagram, LinkedIn, and X with character-limit awareness
7. Drops everything into a local marketing dashboard for review and upload

You bring the take. The skill does the production.

---

## The one question that drives every cut

> **"What is the viewer asking right now, and what visual answers it fastest?"**

Every cut answers a question the script just planted in the viewer's head. Decorative cuts — shader backgrounds, generic stock footage, repeated 3D scenes — answer no question. They cost retention. The skill enforces this by mapping each beat in the spec to a specific visual job, and refuses to render a scene that doesn't have one.

---

## The 8 editing rules baked into the pipeline

1. **Hook with a real source.** First 1–3 seconds is a real news article screenshot or a dramatic claim. Never a talking head, never a title card.

2. **Literal before metaphorical.** A real-object reference first (the actual chip, the actual screenshot, the actual headline). Abstract 3D illustration only after literal context is established. Earn the metaphor.

3. **Slow-fast-slow rhythm.** Hook = fast cuts (1.5–2s). Setup = slower (2.5–3s). Reveal = fast (1–2s). Conclusion = slower (2.5–3s). CTA = punchy (1.5s).

4. **Cut on the question, reveal on the answer.** Hold half a second of silence between question beat and answer beat. Tension creates emphasis.

5. **Zoom on every reveal.** Stat reveals, shock beats, name reveals all get a `zoom: { fromScale: 0.94, toScale: 1.04 }`. Adds energy without adding cuts.

6. **Three-second max per static frame.** No held visual longer than 3s. Either hard-cut to a new visual, or have meaningful internal motion.

7. **Captions are off by default.** Pill-style captions compete with the visuals. Enable only when you want them.

8. **Sound is half the video.** Synthesized SFX on every cut, varied by beat type. Music bed is optional, ducked under narration.

---

## Pacing curve (applied to every script)

```
0–3s     Hook            Fast cuts (1.5–2s)         Big claim, real source
3–15s    Setup           Slow cuts (2.5–3s)         Build context, comparisons
15–40s   Reveal/stack    Fast cuts (1–2s)           Evidence stacking, big stats
40–55s   Conclusion      Slow cuts (2–3s)           Emotional weight, action items
55–61s   CTA             Punchy (1–1.5s)            Handle, follow line
```

A 60-second video at ~2.1s average per cut works out to **27–30 cuts**. Fewer than that and the video feels static. More than that and it feels frantic.

---

## Tech decision rubric

When the script plants a question, the skill picks the visual using this map. It is opinionated by design.

| Question the line raises | Visual the skill picks |
|---|---|
| "Is this claim real / sourced?" | News article mockup (TechCrunch / Bloomberg / NY Post styles, with black-block highlights) |
| "What does this person look like?" | Imagen → Veo (text-described, not photo-fed; non-celebrity only) |
| "Where is this happening physically?" | Veo text-to-video (cinematic B-roll: fab, server-rack, skyline) |
| "How big? How much?" | Stat reveal (giant number on black) |
| "How does X compare to Y?" | Three.js story_3d scene (math_race, cost_8x, etc.) |
| "What's the brand connection?" | Headline card (logo + Bloomberg lower-third) |
| "What are the three things to do?" | Bullet list, one item per beat, with a giant numeral |
| "Pivot / contradiction / quiet emphasis" | Minimal text on pure black (use sparingly — max 3 per video) |

---

## Beat-boarding workflow

For every new video, the skill follows this sequence:

1. **Read the script aloud.** Mark sentence breaks. Note the emotional arc.
2. **Identify the 5–6 key claims** that need the most visual support.
3. **Sketch the beat-board** as a Markdown table: `# | Time | Spoken | Visual | Tech | Why this tech`. Show the user before rendering. Wait for green light.
4. **Phrase-anchor each beat** in `build-cuts-spec.mjs`. Sequential matching ensures repeated phrases attach to the right occurrence.
5. **Generate fresh assets** for the topic (Veo b-rolls, article templates, Three.js variants only if existing ones don't fit).
6. **Render to `out/<topic>-vN.mp4`**, iterate, then move final to `out/final/<topic>-final.mp4` when approved.

The beat-board is the contract. It's the artifact you review BEFORE rendering, so you don't waste the 5–7 minutes.

---

## The mandatory self-QA pass

Before reporting any render to the user, the skill extracts one frame **per beat** (not "every two seconds") and reads every single one against the spec. No skipping. No sampling.

```bash
mkdir -p out/frames-<topic>-vN
node -e "
  const s = require('./public/sessions/<id>/spec-cuts.json');
  let cum = 0;
  s.scenes.forEach(sc => {
    const mid = (cum + sc.durationSeconds / 2).toFixed(2);
    console.log(sc.id, mid);
    cum += sc.durationSeconds;
  });
" | while read id mid; do
  ffmpeg -y -ss $mid -i out/<topic>-vN.mp4 -vframes 1 -q:v 3 \
    "out/frames-<topic>-vN/${id}.jpg" 2>/dev/null
done
```

For each frame the skill checks:

- Does the visual answer the spoken word at this timestamp?
- Is text actually readable? (Three.js cannot render text via primitives — always HTML overlay.)
- Is branded content recognisable? (Real SVG logo via texture, not abstract primitives.)
- Is the layout properly framed? (Cards centered, no empty regions, camera anchored.)
- Are SFX firing on the right beats?

Findings are documented before the user is asked to look. Never "done" without a QA report.

---

## What the skill will not do

These are mistakes that cost retention and trust. The skill enforces them by refusing to render or flagging them in QA.

- ❌ Decorative shader backgrounds with no narrative job.
- ❌ The same 3D scene on two adjacent beats.
- ❌ Photo-fed Veo for known figures (produces AI-stiff animation; always Imagen seed → Veo image-to-video).
- ❌ Audio left unmuted on Veo clips (fights the master narration).
- ❌ Generic atmospheric prompts ("a data center"). Always specify lens, grade, reference, motion.
- ❌ Captions over the visuals by default.
- ❌ All three bullet items on one card. Each enumerated item gets its own beat with a giant numeral.
- ❌ Ken Burns zoom on everything. Reveal cuts only.
- ❌ The same SFX on every cut.
- ❌ Three.js `boxGeometry` to "fake" letters. Boxes do not look like letters. Always use HTML/CSS overlay for text, Three.js for backdrop.
- ❌ Abstract primitives instead of real logos.
- ❌ Shipping a render without watching it. Frame-by-frame QA is mandatory.
- ❌ TTS-unfriendly script punctuation. Short stop-then-stop sentences sound robotic. Connect with "and" / "but" / "so".
- ❌ Aggressive camera zoom that crops UI mockups. Default zoom for HTML mockups is `1.0 → 1.2`.

---

## Three.js: what it can and can't do

The hard-won pattern: **Three.js for backdrop, HTML/CSS for foreground**.

**Three.js can:**
- Particle systems (flames, embers, sparkles)
- Geometric primitives that represent concepts (bars, columns, rings, loops)
- Glow, depth, atmospheric backdrop
- Branded geometry as supporting elements
- Camera motion (orbit, dolly)

**Three.js cannot, no matter how hard you try:**
- Render text via primitives. They look like glowing blank rectangles. Always overlay HTML on top.
- Recreate logos with cones/bars. They don't read. Load the real SVG via CSS mask in HTML overlay.
- UI replicas at readable text quality. Use Remotion HTML/CSS for Claude/GitHub-style mockups.

The wiring point in this codebase: `Story3DScene`'s `VariantOverlay`. Three.js renders behind, HTML renders on top, both pinned to the same beat timeline.

---

## (Optional) HeyGen avatar pipeline

For when you want yourself (or a custom presenter) on screen in some videos — not every one, just the ones that benefit from a face. The skill ships with a HeyGen integration that wires a trained avatar into specific scene slots.

### When to use it

Avatar segments work best at:
- The hook (first 3–5 seconds) — establishes the speaker as the source of the take
- The CTA (last 3–4 seconds) — the personal moment that asks for the follow

Avatar segments work worst at:
- Mid-video data reveals — the face competes with the data
- Decorative beats — wastes attention

Use sparingly. A reasonable upper bound: ~10–15% of total video screen time. More than that and the avatar becomes the show, not the substance, and retention drops on muted-mobile playback (which is most playback).

### Architecture (Path D)

```
ElevenLabs audio.mp3  ─┐
                       ├─→ slice → upload to HeyGen as asset
                       │              ↓ asset_id
                       │     create_video_from_avatar (OAuth MCP)
                       │              ↓ video_id
                       │     poll /v1/video_status.get
                       │              ↓ video_url
                       └─→ download → AvatarClipScene → Remotion composite
```

The audio is generated once via ElevenLabs, then a slice is uploaded to HeyGen as an asset. HeyGen generates a lip-synced video against that asset. The result is downloaded and composited as a scene type alongside the other Remotion scenes.

### Critical billing rule (don't get this wrong)

There are two paths to HeyGen and they bill differently. Pick the wrong one and you'll burn API credits that aren't included in your subscription.

| Path | Tool to call | Billing |
|---|---|---|
| **OAuth MCP** *(use this)* | `mcp__heygen__create_video_from_avatar` | Subscription credits — included in your HeyGen plan (Free's 1 Avatar IV vid/mo, Creator's ~200/mo) |
| **Direct REST** with `X-API-KEY` | `/v2/video/generate` | Separate API credits — **NOT** included in subscription |

Always go OAuth path for video generation. Asset upload via the API key is fine (it's storage, no credit cost).

### Resolution gates

- Free tier rejects 1080p with `RESOLUTION_NOT_ALLOWED`. Use 720p on Free.
- Creator+ supports 1080p.

### Avatar engine quirk

`digital_twin` avatars only support `avatar_iv` and `avatar_v` engines. The server auto-picks the engine — there's no override flag. Quotas are per-engine-tier, so there's no "downgrade to III" escape hatch if you blow through your IV credits.

### Slot patterns (general guidance)

This is the part that takes iteration. Where in the video the avatar appears matters more than how many seconds you give it. The skill exposes scene types like `avatar_split_headline` (avatar + topic card) and `avatar_fullscreen` (face fills frame), and you compose them into the spec by hand or via Claude.

The specific slot calibration that lands hardest for a given creator (which beat to put the avatar at, which to leave for data viz, when to splitscreen vs fullscreen) is exactly the kind of thing you'll dial in by shipping. The skill ships the mechanism, not the calibration.

### What you bring

- A trained HeyGen avatar (`avatar_id`) and matching cloned voice (`voice_id`)
- A subscription that has the right Avatar IV/V credits for your monthly volume
- One identity file in your local project (gitignored) holding those IDs

### What the skill handles

- Audio slicing aligned to the avatar beat boundaries
- Asset upload via the storage endpoint
- Video generation via the OAuth MCP path
- Polling and download
- Compositing the result as a Remotion scene
- Muting the avatar mp4 in Remotion (the master ElevenLabs audio is already playing globally)

### Reusing avatar clips across renders

Generated avatar mp4 files are reusable across rendered versions. Once you've generated an avatar clip for a topic, re-rendering the same topic with a different layout costs $0 in HeyGen credits — the generated mp4s sit in your sessions directory and the spec just references them. Plan your iteration accordingly: render layout-only changes (cuts, captions, music) without re-queuing HeyGen.

---

## Script writing rules for TTS

These are non-negotiable if you're using ElevenLabs or any other modern TTS:

1. **Connect short sentences with "and" / "but" / "so".** Periods between 2–3 word sentences sound robotic.
2. **Em-dashes are fine.** "Now to be clear — Gemini still wins…" reads naturally.
3. **Read aloud before approval.** If you have to pause awkwardly between two sentences, the voice will too.
4. **No abbreviations the model can't read.** "GPT-4o" reads fine. "GH200" reads as "G H two hundred". Spell out where it matters.

---

## Install

```bash
git clone https://github.com/<your-username>/daily-ai-shorts
cd daily-ai-shorts
npm install --legacy-peer-deps
cp .env.example .env
```

Required env vars:

```bash
ELEVENLABS_API_KEY=...
ELEVENLABS_VOICE_ID=...           # your cloned voice
GEMINI_API_KEY=...                # script analysis
GOOGLE_VERTEX_PROJECT=...         # Veo b-roll (optional)
ANTHROPIC_API_KEY=...             # if orchestrating via Claude API

# HeyGen avatar pipeline (optional)
HEYGEN_API_KEY=...                # for asset uploads
HEYGEN_AVATAR_ID=...              # your trained avatar
HEYGEN_VOICE_ID=...               # avatar voice (often same as ElevenLabs voice clone)
```

---

## Quick start

```bash
# 1. Run the dashboard
npm run dashboard      # http://localhost:5173

# 2. Render an example video
node scripts/render-full.mjs specs/example-news.json

# 3. The video lands in out/<topic>-final.mp4
#    The publishing kit lands in out/final/queue/<topic>-publishing-kit.md
#    Both show up automatically in the dashboard's Queue tab
```

A single command from topic to finished video:

```bash
node scripts/render-full.mjs "your topic name here"
```

---

## What's in this repo

| Folder | What's there |
|---|---|
| `SKILL.md` | This file — Claude reads it to know how to render |
| `dashboard/` | Local marketing operations: queue, calendar, roadmap, performance, drag-to-reorder, copy-to-clipboard captions. Multi-page Express app, no build step. |
| `src/compositions/` | Remotion compositions and scene shells (`reddit_native`, `claude_native`, `data_table`, `terminal`, `screenshot`, etc.) |
| `scripts/render-full.mjs` | Pipeline orchestrator: script → spec → voice → frames → MP4 |
| `scripts/publish/` | Per-platform upload helpers (YouTube Data API live; LinkedIn / X to come) |
| `orchestrator/` | Topic → spec generation primitives |
| `specs/example-*.json` | Sanitized example specs you can render to verify the pipeline |
| `templates/publishing-kit.md` | Markdown template for per-platform captions |

---

## The dashboard

```bash
npm run dashboard      # http://localhost:5173
```

A multi-page local-only Express app. Each section has its own URL:

| Page | URL | What it does |
|---|---|---|
| Today | `/today` | Day-of-week mode (post / engage / ideate / rest), due milestones, posting playbook |
| Queue | `/queue` | Drag-to-reorder list of rendered videos. Top of list = next post day. |
| Calendar | `/calendar` | Schedule auto-recomputed from cadence; posting windows per platform |
| Roadmap | `/roadmap` | Personal-brand milestones with Day-N or date triggers |
| Performance | `/performance` | Log views/likes/saves at 24h / 7d / 30d, see top performers |
| Ideas | `/ideas` | Topic backlog with priority + theme tags |
| Hooks | `/hooks` | Reusable opening-line templates — copy and adapt |
| Playbook | `/playbook` | Marketing strategy notes + append-only "Lessons learned" log |

State lives in plain JSON in `dashboard/data/`. No database. To add a new section, drop a route file and a view file. See `dashboard/README.md`.

---

## Scene types Claude knows

When Claude is composing a video spec, it picks scenes from this library. Each is a React component with controlled entry/exit timing aligned to word timestamps.

| Type | Use it for |
|---|---|
| `reddit_native` | Real Reddit screenshots — anchor "someone on Reddit said…" hooks |
| `claude_native` | Mock Claude / ChatGPT chat UIs |
| `terminal` | Code-style terminal cards |
| `screenshot` | Scrolling website screenshots (mobile viewport) |
| `data_table` | Comparison tables with row reveals |
| `news_article` | TechCrunch / Bloomberg / NY Post mockups with black-block highlights |
| `headline_card` | Logo + lower-third + headline |
| `stat_reveal` | Giant number on black with CountUp animation |
| `bullet_item` | One enumerated item with giant coral numeral |
| `veo_broll` | Veo-generated cinematic b-roll, full-bleed |
| `story_3d` | Three.js variants (math_race, cost_8x, token_burn, etc.) |
| `minimal_text` | Pure black with one line of text — use sparingly |
| `avatar_split_headline` | *(optional, HeyGen)* split-screen with topic card on top, presenter face on bottom — best at the hook |
| `avatar_fullscreen` | *(optional, HeyGen)* presenter face fills the frame — best at the CTA, max 3–4s |

---

## The publishing kit format

Every rendered video produces a Markdown publishing kit. The dashboard parses it and renders copy-buttons with live char counters.

```markdown
## YouTube Shorts
### Title
60-char headline

### Description
multi-line description

### Tags
tag1, tag2, tag3

## Instagram Reels
### Caption
hook line that works cut at 125 chars
...rest of caption

## LinkedIn
### Caption
professional version

## X (Twitter)
### Tweet
≤ 280 chars (free account)

### Thread followups
optional thread reply 1
optional thread reply 2
```

---

## Cost expectations per video

| Asset | Count | Cost (rough) |
|---|---|---|
| ElevenLabs voiceover | 1 narration (~60s) | covered by typical creator plan |
| Imagen seed images | 0–2 | ~$0.08 |
| Veo b-roll clips | 2–4 | ~$1.60 |
| Veo figure clips (Imagen→Veo) | 0–2 | ~$1.00 |
| Render compute | 1 final + ~3 iterations | free (local CPU) |
| **Total per video** | | **~$2–3 from Cloud credits** |

Render time on a normal laptop: ~5–7 minutes per pass (bundle + render + encode). Batch small tweaks rather than iterating one change at a time.

---

## What's deliberately not in this repo

The framework ships open. The parts that make a *channel* yours, not mine, you build:

- **Voice clone settings.** ElevenLabs stability, similarity, style — these are tuned to a specific voice and tone. Yours will be different. Spend an afternoon with the ElevenLabs studio and dial yours in.
- **Topic-research process.** Which AI news matters this week, who you're writing for, the contrarian angle — that's editorial judgement, not code.
- **Hooks library.** A populated database of opening-line templates that work for your audience. You build it as you ship and learn.
- **Performance benchmarks.** Your channel's 3-second retention floor, your save-to-share ratio, your DM-send rate — yours, not anyone else's.
- **Per-platform copy calibration.** The skill produces draft captions; the voice you tune for your audience is yours.

The plumbing is here. The take is yours.

---

## Roadmap

- [x] Render pipeline (Remotion + Three.js + ElevenLabs + Veo)
- [x] Publishing kit format (YT / IG / LinkedIn / X with char limits)
- [x] Local marketing dashboard (multi-page Express)
- [x] Drag-to-reorder queue with cadence-driven schedule
- [x] Roadmap with Day-N triggers
- [x] YouTube Data API uploader
- [x] HeyGen avatar pipeline (optional, off by default)
- [ ] LinkedIn API uploader
- [ ] X (Twitter) API uploader
- [ ] Auto-fetch performance metrics from each platform's API
- [ ] Voice cloning setup walkthrough

---

## Contributing

Issues welcome. PRs welcome. Especially: new scene types, new platform uploaders, new SFX recipes that aren't in the library yet.

What we won't merge: anything that breaks the "one question per beat" contract, or anything that adds dependencies you'd hate to maintain.

---

## License

MIT. Use it, fork it, ship your own channel.

If you ship something built on this, tag the original author — happy to boost it.

---

## Built by

[Khizer Hussain](https://youtube.com/@AIinBusiness) · LinkedIn · X
