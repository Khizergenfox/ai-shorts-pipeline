export type SceneType =
  | "screenshot"       // full-screen Puppeteer screenshot (main type for V3)
  | "reddit_native"    // native Remotion Reddit component (when Puppeteer blocked)
  | "claude_native"    // native Remotion Claude chat component
  | "terminal"         // black bg, green highlighted command
  | "beige_illustration" // Imagen on beige background
  | "veo_clip"         // Veo-generated video clip
  | "text_card"        // dark bg, bold text overlay
  | "shader_bg"        // Three.js GLSL shader background + bold text overlay (no external assets)
  | "story_3d"         // Three.js narrative 3D scene (DropCard / CoinStacks / BarRace / ChipReveal / NodeNetwork)
  | "headline_card"    // Editorial breaking-news headline card (Bloomberg-style)
  | "pricing_compare"  // Side-by-side pricing tier comparison
  | "takeaway_card"    // Closing typographic takeaway
  | "bullet_list"      // Numbered list (1/2/3) — practical action items
  | "figure_clip"      // Veo image-to-video of a named figure (Sam Altman, Sundar Pichai…) with Bloomberg-style lower-third
  | "minimal_text"     // Pure black bg + clean sans-serif type, no decoration (Varun Mayya playbook)
  | "stat_reveal"      // Giant single number on black, headline + subhead
  | "news_article"     // Fake-but-realistic news article look with black-block phrase highlights
  | "claude_ui_zoom"   // Replica of an LLM usage UI with zooming progress bar
  | "github_readme"    // Replica of GitHub repo card with install button
  | "claude_chat_mockup"  // LLM chat replica with prompt + response states
  | "campaign_launch"     // Ads/campaign launch panel mockup
  | "pipeboard_mockup"    // Marketplace / dashboard UI mockup
  | "claude_desktop_mockup" // Desktop-app settings panel — paste/tools states
  | "meta_form"           // URL + budget form mockup (auto-campaign style)
  | "avatar_fullscreen"   // HeyGen avatar mp4 fills full 9:16 frame (hook/outro talking head, lip-synced to ElevenLabs audio)
  | "avatar_split_3d"     // Top 62% = story_3d viz, bottom 38% = avatar
  | "avatar_split_headline" // Top 62% = headline_card, bottom 38% = avatar
  | "avatar_split_news"   // Top 62% = news_article, bottom 38% = avatar (with startFrom offset for chained beats)
  | "avatar_split_minimal" // Top 62% = minimal_text, bottom 38% = avatar (with startFrom offset)
  | "claude_refusal_mockup"  // LLM-style chat replica showing user prompt + assistant refusal state
  | "benchmark_leaderboard"  // Animated bar leaderboard with brand logos
  | "company_value_chart"    // Rising stock-style chart + counter animation
  | "safety_levels"          // Concentric rings around a capability core (e.g. AI safety levels)
  | "image_gen_race"         // Multiple tools racing as bars (e.g. image generators)
  | "agent_terminal"         // Multi-agent terminal log streaming
  | "split_dual_workflow"    // Top: chaotic workflow / Bottom: clean alternative
  | "negation_reveal"        // "NOT A X" with strikethrough, optional affirm
  // legacy types kept for compatibility
  | "full_scroll"
  | "github"
  | "infographic"
  | "talking_head"
  | "text_slide"
  | "split_screen"
  | "reddit_card"
  | "claude_chat"
  | "token_counter"
  | "data_table"
  | "logo_grid"
  | "stat_triple";

// ── Zoom config ──────────────────────────────────────────────────────────────
export interface ZoomConfig {
  // Scale at start and end of scene (1.0 = no zoom)
  fromScale: number;
  toScale: number;
  // Where to zoom toward (0–1, 0=left/top, 1=right/bottom)
  focusX: number;
  focusY: number;
}

// ── Inline highlight: highlights a word/phrase ON the screenshot ─────────────
export interface InlineHighlight {
  // Fraction of screenshot height where the highlight should appear (0–1)
  yFraction: number;
  // Fraction of screenshot width: left and right edges
  xLeft: number;
  xRight: number;
  color?: string; // default: salmon
}

// ── Legacy data shapes (kept for existing components) ───────────────────────

export interface ZoomTarget {
  x: number; y: number; width: number; height: number; startFraction?: number;
}

export interface RedditData {
  subreddit?: string; username?: string; timeAgo?: string;
  title: string; bodyLines?: string[];
  upvotes?: number; comments?: number;
  animateUpvotes?: boolean; highlightLine?: number;
}

export interface ChatMessage { role: "user" | "assistant"; text: string; }
export interface ChatData {
  messages: ChatMessage[]; model?: string;
  revealMode?: boolean; scrollPx?: number;
}

export interface TokenData {
  headline?: string;
  leftLabel?: string; leftFrom?: number; leftTo?: number;
  rightLabel?: string; rightFrom?: number; rightTo?: number;
  savingsPct?: string;
}

export interface TableRow { task: string; normal: number; caveman: number; saved: string; }
export interface TableData {
  title?: string; rows?: TableRow[];
  highlightRow?: number; revealMode?: boolean;
}

export interface LogoData {
  headline?: string;
  tools?: { name: string; emoji: string; color: string }[];
}

export interface StatData {
  title?: string;
  stats: { emoji: string; value: string; label: string; color?: string }[];
}

// ── Main Scene type ──────────────────────────────────────────────────────────

export interface Scene {
  id: string;
  type: SceneType;

  // ── TIMING (V3: word-index driven) ───────────────────────────────────────
  // Set these in the spec; orchestrator computes durationSeconds from them
  startWordIndex?: number;   // inclusive — scene starts when this word is spoken
  endWordIndex?: number;     // inclusive — scene ends after this word finishes
  // Fallback: manual duration if word indices not set
  durationSeconds: number;

  // Caption text (used as fallback if word timestamps not available)
  caption: string;

  // ── ZOOM ─────────────────────────────────────────────────────────────────
  zoom?: ZoomConfig;

  // ── ASSET PATHS (filled by orchestrator) ────────────────────────────────
  screenshotPath?: string;
  videoClipPath?: string;
  imagenFramePath?: string;

  // ── AVATAR (used by avatar_split_* scene types when chaining the same
  //    avatar mp4 across multiple sequential beats — each beat plays its
  //    slice of the global avatar mp4 starting at this offset, so the avatar
  //    appears continuous while the top scene changes content)
  avatarStartFromSec?: number;

  // ── SOURCE URLs ──────────────────────────────────────────────────────────
  screenshotUrl?: string;       // URL for Puppeteer to capture
  screenshotScrollPx?: number;  // how far to scroll before capture

  // ── TERMINAL ─────────────────────────────────────────────────────────────
  terminalLines?: string[];
  terminalHighlightLine?: number; // which line to highlight in green

  // ── BEIGE ILLUSTRATION ───────────────────────────────────────────────────
  imagenPrompt?: string;

  // ── VEO ──────────────────────────────────────────────────────────────────
  veoPrompt?: string;
  veoImageUrl?: string;
  // "fullbleed" (default) or "centered" (emotional human moment with black bars)
  clipStyle?: "fullbleed" | "centered";
  // Italic serif word overlaid on a centered clip (e.g. "you", "worried")
  clipWordOverlay?: string;

  // ── HEADLINE OVERLAY (for stat/number moments on claude_native / reddit_native) ──
  // Large white serif heading that appears at the TOP of the scene
  // The source content stays visible but dimmed in the background
  headlineText?: string;
  // Exact text from the source content that gets the salmon (#E8907A) highlight box
  salmonHighlightLine?: string;

  // ── TEXT CARD ────────────────────────────────────────────────────────────
  textContent?: string;  // supports **bold** and newlines

  // ── SHADER BG ────────────────────────────────────────────────────────────
  // Used when type === "shader_bg" — picks the GLSL fragment shader preset.
  shaderPreset?: "gradient" | "plasma" | "network" | "neongrid";

  // ── STORY 3D ─────────────────────────────────────────────────────────────
  // Used when type === "story_3d" — picks the narrative 3D variant. Extend
  // the union with your own variant names; the implementation switch lives
  // in `src/scenes/Story3DScene.tsx`.
  storyVariant?: "math_race" | "node_network" | "cost_8x" | string;

  /** Optional Veo cinematic clip rendered as a full-bleed background BEHIND
   *  the 3D layer. Adds photoreal depth. The 3D layer overlays on top with
   *  a semi-transparent stage. */
  videoBgSrc?: string;
  /** Darkening overlay strength (0-1) on the video bg, so 3D objects pop.
   *  Default 0.45. */
  videoBgDim?: number;

  // ── HEADLINE CARD ────────────────────────────────────────────────────────
  headlineData?: {
    eyebrow?: string;
    headline: string;
    accentLine?: string;
    subcaption?: string;
    logoSrc?: string;
    accentColor?: string;
  };

  // ── PRICING COMPARE ──────────────────────────────────────────────────────
  pricingData?: {
    eyebrow?: string;
    headline?: string;
    left: {
      label: string;
      logoSrc: string;
      accentColor: string;
      accentGradient?: { from: string; to: string; angle?: number };
      price: number;
      unit: string;
    };
    right: {
      label: string;
      logoSrc: string;
      accentColor: string;
      accentGradient?: { from: string; to: string; angle?: number };
      price: number;
      unit: string;
    };
    ratio?: number;
    source?: string;
  };

  // ── TAKEAWAY CARD ────────────────────────────────────────────────────────
  takeawayData?: {
    intro?: string;
    headline: string;
    handle?: string;
    accentColor?: string;
  };

  // ── BULLET LIST ──────────────────────────────────────────────────────────
  bulletData?: {
    eyebrow?: string;
    headline?: string;
    items: { marker: string; heading: string; detail?: string }[];
    accentColor?: string;
    staggerSec?: number;
  };

  // ── UI MOCKUP STATE (used by claude_ui_zoom + github_readme) ─────────────
  /** Drives which sub-state the UI mockup renders. Each mockup scene
   *  defines its own state strings — see the individual scene components
   *  in src/scenes/ for the supported values. */
  uiState?: string;

  /** Optional chat content for ClaudeChatMockupScene. */
  claudeChatData?: { prompt?: string; response?: string };

  /** Optional per-beat SFX override. If unset, MainVideo's pickSfx() picks
   *  by scene type. Filename relative to public/sfx/, e.g. "typing.mp3". */
  sfx?: string;

  // ── NEWS ARTICLE (fake-but-realistic article look) ──────────────────────
  articleData?: {
    /** Display name of the source, e.g. "TECHCRUNCH", "NEW YORK POST" */
    source: string;
    /** Source brand color (e.g. NY Post red, TC green). Falls back to style preset. */
    sourceColor?: string;
    /** Top-right uppercase tag like "BREAKING · TODAY" */
    eyebrow?: string;
    /** Big serif headline */
    headline: string;
    /** "By Author · 2 hrs ago" line */
    byline?: string;
    /** Multi-line body text */
    body?: string;
    /** Phrases from the body to highlight with black-block + white text */
    blackBlocks?: string[];
    /** A phrase to cross out in red (used for the "China is winning" beat) */
    strikethrough?: string;
    /** Visual style preset — picks source color + accent color automatically */
    style?: "techcrunch" | "nypost" | "bloomberg" | "neutral";
  };

  // ── STAT REVEAL (giant single number on black bg) ───────────────────────
  statRevealData?: {
    prefix?: string;
    value: string;
    unit?: string;
    headline?: string;
    subhead?: string;
    accentColor?: string;
  };

  // ── FIGURE CLIP (Veo image-to-video of named figures) ────────────────────
  /** Used when type === "figure_clip". The clip itself is generated by
   *  scripts/gen-veo-figure.mjs from a portrait + figure-prompts.mjs entry. */
  figureData?: {
    /** Path under public/, e.g. "sessions/ds-v4-full/veo-clips/sam.mp4" */
    videoSrc: string;
    /** Lower-third title, e.g. "SAM ALTMAN  ·  CEO, OPENAI" */
    titleLine: string;
    /** "fullbleed" (default) or "split" (top=clip, bottom=creator A-roll slot) */
    style?: "fullbleed" | "split";
    /** Editorial coral wash + grayscale */
    duotone?: boolean;
    /** Optional creator A-roll src for split mode */
    bottomVideoSrc?: string;
  };

  // ── INLINE HIGHLIGHT (overlay on screenshot) ─────────────────────────────
  inlineHighlight?: InlineHighlight;

  // ── Legacy fields ────────────────────────────────────────────────────────
  scrollHeightPx?: number;
  zoomTarget?: ZoomTarget;
  redditData?: RedditData;
  chatData?: ChatData;
  tokenData?: TokenData;
  tableData?: TableData;
  logoData?: LogoData;
  statData?: StatData;
}

// ── Word timestamps from ElevenLabs ─────────────────────────────────────────
export interface WordTimestamp {
  word: string;
  startTime: number;  // seconds
  endTime: number;    // seconds
}

// ── Context overlay (logos / images that flash on key beats) ────────────────
export type AnchorPosition =
  | "topLeft" | "topCenter" | "topRight"
  | "middleLeft" | "center" | "middleRight"
  | "bottomLeft" | "bottomCenter" | "bottomRight";

export interface ContextOverlay {
  src: string;
  startWordIndex?: number;
  startSec?: number;
  durationFrames?: number;
  /** Where in the frame to position. 9-position grid lets each overlay
   *  sit near its relevant 3D object instead of always corner-stuck. */
  anchor?: AnchorPosition;
  /** Size in px. Default 180. */
  size?: number;
  recolor?: string;
  recolorGradient?: { from: string; to: string; angle?: number };
  /** Small caption rendered below the logo. */
  label?: string;
  fallbackText?: string;
}

// ── Portrait insert (editorial photo at side of frame for a beat) ──────────
export interface PortraitInsertSpec {
  /** Path to portrait image, e.g. "refs/xi.jpg". User-supplied. */
  src: string;
  startWordIndex?: number;
  startSec?: number;
  durationFrames?: number;
  name: string;
  subtitle?: string;
  side?: "left" | "right";
}

// ── Full video spec ──────────────────────────────────────────────────────────
export interface VideoSpec {
  sessionId: string;
  topic: string;
  narrationScript: string;
  audioPath: string;
  wordTimestamps: WordTimestamp[];
  totalDurationSeconds: number;
  scenes: Scene[];
  overlays?: ContextOverlay[];
  portraits?: PortraitInsertSpec[];
}
