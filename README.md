# ai-shorts-pipeline

For anyone whose calendar is full but whose audience still expects to hear from them.

Daily content has become a tax on every operator, founder, and builder trying to grow a name. Most days you don't have an hour to record, edit, caption, and post. **ai-shorts-pipeline automates the production so you can keep showing up — even on the days you can't.** The point isn't to make videos faster for fun. The point is **consistency** for the people whose real job isn't creating content but who still need to.

It's a Claude Code skill. You give it a topic and a couple of source links. It hands back a finished 60-second vertical video, a voiceover in your cloned voice, and per-platform captions for YouTube Shorts, Instagram Reels, LinkedIn, and X. ~5–7 minutes per video on a normal laptop.

![Marketing HQ dashboard — Today view](./assets/dashboard-today.png)

Under the hood, the skill orchestrates these moving parts in a single render pass:

- **ElevenLabs** for voiceover (your cloned voice), with word-level timestamp alignment
- **Vertex Veo** for cinematic B-roll (text-to-video and Imagen→Veo image-to-video)
- **Three.js** for custom 3D scenes — particle systems, brand strikethroughs, data-viz
- **Remotion** for everything else: composition, timing, encoding, frame extraction
- **HeyGen** *(optional)* for presenter-led avatar segments at the hook and CTA

Plus a local-only **marketing HQ dashboard** (multi-page Express app) for queue management, posting cadence, and per-platform publishing kits with copy-buttons and char-limit enforcement.

Battle-tested on [@AIinBusiness](https://youtube.com/@AIinBusiness) — daily videos rendered by this exact pipeline.

---

## What you get vs what you bring (read this first)

This repo is honest about what it does and doesn't do.

**What you get from cloning this repo:**
- A skill protocol Claude follows for every video — editing rules, scene grammar, pacing curves, anti-patterns, mandatory QA workflow. The decisions that took us months to settle, condensed into one file.
- A working marketing HQ dashboard you can run on `localhost`. Queue, calendar, roadmap, performance, ideas, hooks, playbook.
- (Coming in v0.2) The actual render pipeline: Remotion compositions, render scripts, gen-audio, gen-veo helpers, an orchestrator that turns a topic into a spec.

**What you bring yourself:**
- Your voice clone settings (ElevenLabs stability, similarity, style — these are tuned to a specific voice and tone; yours will be different)
- Your topic-research process (which AI news matters this week, who you're writing for, the contrarian angle — that's editorial judgment, not code)
- Your hooks library (you build it as you ship and learn)
- Your performance benchmarks (your channel's 3-second retention floor, your save-to-share ratio — yours, not mine)
- The take. Always the take.

The plumbing is here. The framework gives you ~70% of the craftsmanship of *framing*. The 30% — the voice you tune, the hooks you build, the takes you bring — is what makes the channel *yours* instead of mine. That's a feature, not a gap.

For the full skill protocol — editing rules, scene grammar, anti-patterns, QA workflow — see [`SKILL.md`](./SKILL.md).

---

## How it fits together

```mermaid
flowchart LR
    A[Topic + sources] --> B[Claude Code]
    B -->|drafts narration| C[Script]
    C -->|word-level alignment| D[ElevenLabs voiceover]
    C -->|scene-by-scene spec| E[Remotion composition]
    E -->|backdrop + 3D| F[Three.js scenes]
    E -->|cinematic B-roll| G[Vertex Veo]
    E -->|optional avatar| H[HeyGen]
    D --> I[Render pass]
    E --> I
    F --> I
    G --> I
    H --> I
    I --> J[1080×1920 MP4]
    I --> K[Per-platform publishing kit]
    J --> L[Marketing HQ dashboard]
    K --> L
    L -->|YouTube · Instagram · LinkedIn · X| M[Posted]

    style B fill:#f59e0b,stroke:#92400e,color:#1c1917
    style I fill:#f59e0b,stroke:#92400e,color:#1c1917
    style L fill:#1f2937,stroke:#f59e0b,color:#f5f5f4
    style M fill:#10b981,stroke:#064e3b,color:#1c1917
```

The skill is the orchestration layer. Claude reads `SKILL.md`, picks the right scenes for each beat, generates the spec, and runs the render. The dashboard is where you actually live — queueing, scheduling, copying captions, tracking what shipped.

---

## Quick start

```bash
git clone https://github.com/Khizergenfox/ai-shorts-pipeline.git
cd ai-shorts-pipeline
npm install
cp .env.example .env
# Dashboard runs without any keys. Render pipeline (v0.2) needs ELEVENLABS_API_KEY etc.

npm run dashboard      # opens http://localhost:5173
```

The dashboard is the marketing HQ — queue, calendar, roadmap, performance, ideas, hooks, playbook. All local, all yours, no internet exposure.

---

## What the marketing HQ looks like

Multi-page Express app, no build step. Each section is its own URL so it's easy to extend (drop a route file + a view file).

### Today — day-of-week mode + posting playbook

![Today view — drop tutorial mode + posting windows by platform](./assets/dashboard-today.png)

The Today page knows what day it is and tells you what mode you're in (post / engage / ideate / rest), the one CTA, and the posting playbook for today. Posting windows per platform, engagement velocity rules, the whole thing scoped to right now.

### Queue — what's rendered and waiting

![Queue view — empty-state showing where to drop renders](./assets/dashboard-queue.png)

Drag-to-reorder list of rendered videos waiting to ship. Top of list = next post day. Click any video to see per-platform captions with copy buttons, live char counters on the X tweet, and a mark-posted form that promotes it to the Uploaded section.

### Roadmap — milestone-driven launch plan

![Roadmap view — Day-N triggered milestones](./assets/dashboard-roadmap.png)

Personal-brand milestones with Day-N or specific-date triggers, anchored to a launch date you set. Add milestones from the form, see them surface on the Today page when their trigger fires.

### Hooks — reusable opening-line library

![Hooks view — copyable opening-line templates with tags](./assets/dashboard-hooks.png)

Reusable opening-line templates with tags (contrarian, honest-reversal, from-the-trenches, etc.). One click to copy. You build your own library as you ship and learn what hooks land.

### Playbook — strategy notes + Lessons learned log

![Playbook view — append-only Lessons learned log](./assets/dashboard-playbook.png)

Marketing strategy notes and an append-only "Lessons learned" log. Every shipped video gets a one-line entry: what worked, what didn't, what to do differently. Over time this becomes the most valuable file in the repo.

---

## What comes out the other end

A single example frame from a recent rendered short, showing the news-article scene type doing its job (real publication style, real headline, scene-driven typography):

![Sample frame — Anthropic article mockup scene](./assets/sample-output-frame.jpg)

The skill enforces "literal before metaphorical" — real news article mockups before any abstract 3D explanation. Editing rules and scene grammar are in [`SKILL.md`](./SKILL.md).

---

## What's in this release (v0.2.0)

- ✅ `SKILL.md` — the full skill protocol Claude reads to render videos (editing rules, scene grammar, pacing curves, QA workflow, HeyGen avatar pipeline)
- ✅ `dashboard/` — local marketing operations (multi-page Express, no build step, drag-to-reorder queue, copy-to-clipboard captions, append-only "Lessons learned" log)
- ✅ **Render pipeline** — Remotion entry, ~40 scene type implementations, 18 Three.js variants, the orchestrator, and 9 production scripts (render-full, gen-audio, gen-veo-broll-cinematic, gen-veo-from-imagen, gen-heygen-clip, poll-heygen-clips, render-3d, build-cuts-spec, test-vertex-auth)
- ✅ All 12 synthesized SFX in `public/sfx/` so renders have sound on first run
- ✅ `specs/example-news.json` and `scripts/example.txt` so you can see the spec shape and render an example end-to-end
- ✅ Story3DScene ships as a **placeholder stub in v0.2.0** — the full data-driven variant library (math_race, cost_8x, token_burn, sonar_pulse, stat_3d_extrude, etc.) drops in v0.2.1. The underlying Three.js components in `src/effects/three/` are usable directly today
- ✅ Voice tuning is **env-var driven** — `ELEVENLABS_STABILITY` / `_SIMILARITY_BOOST` / `_STYLE` / `_USE_SPEAKER_BOOST`. Defaults are ElevenLabs' neutral starting point (0.5 / 0.75 / 0.0). Tune to your cloned voice.

You can clone, set keys, drop a script in `scripts/example.txt`, and run `node scripts/gen-audio.mjs scripts/example.txt example` followed by `node scripts/render-full.mjs example` to produce your first video.

---

## Roadmap

- [x] **v0.1.0** — Skill spec, marketing HQ dashboard, example data, architecture diagram
- [x] **v0.1.1** — Clarified positioning, HeyGen avatar layer documented in SKILL
- [x] **v0.2.0** — Render pipeline (Remotion compositions, render-full, gen-audio, Veo b-roll, HeyGen avatar helpers, all SFX)
- [ ] **v0.2.1** — Full Story3D variant library (data-driven), additional scene types (channel-agnostic versions of the 10 currently held back), generic spec-builder template
- [ ] **v0.3.0** — YouTube + LinkedIn + X uploaders integrated into dashboard
- [ ] **v0.4.0** — Auto-fetch performance metrics from each platform's API
- [ ] **v0.5.0** — Voice cloning setup walkthrough

---

## Built by

[Khizer Hussain](https://github.com/Khizergenfox) · [@AIinBusiness on YouTube](https://youtube.com/@AIinBusiness)

Also building [GenFox.AI](https://genfox.ai). This is the side project I run in public, for people who want to ship daily AI content without a video team.

---

## License

MIT. Use it, fork it, ship your own channel.

If you ship something built on this, tag me — happy to boost it.
