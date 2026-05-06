import Anthropic from "@anthropic-ai/sdk";
import { Scene } from "./types";

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

/**
 * Editing rules derived from frame-by-frame analysis of 6 reference YouTube Shorts.
 *
 * KEY CORRECTIONS vs earlier assumptions:
 * 1. Stats/numbers are NEVER shown on a standalone empty screen.
 *    They appear as a serif headline OVERLAID on faded source content (Claude chat, Reddit post).
 *    The source text stays visible in the background, dimmed. Big heading builds at top. Salmon box on the stat line.
 *
 * 2. Veo clips are FULL-BLEED cinematic video that fills the whole 9:16 frame.
 *    They are used for: stock-footage-style visual metaphors (hospital monitor, blurred code, person at desk).
 *    Think B-roll, not a person talking. Caption pill floats over the video.
 *
 * 3. Human/emotional scenes use cinematic clips (Veo) or centered-clip-with-black-bars style.
 *    They are short (2-4 seconds), used as transitions or when the narration is about a person/feeling.
 *
 * 4. Screenshots (Reddit, Twitter, GitHub, Claude.ai) can have SALMON HIGHLIGHT BOXES on specific lines.
 *    This is done via highlightLine in the scene data — it highlights a key phrase within the screenshot.
 *
 * 5. The screen is NEVER empty. When there is no UI to show, use a Veo clip (cinematic B-roll).
 */
const EDITING_SYSTEM_PROMPT = `You are an expert short-form video editor for an AI & technology YouTube Shorts channel.
Your job: turn a narration script into a precise video spec JSON.

## REAL EDITING PATTERNS (from actual frame analysis of 6 reference videos)

### Pattern 1: STAT/NUMBER OVERLAY — the most important pattern
When a key stat or number is mentioned in the narration:
- DO NOT create a standalone text card with just the number
- INSTEAD: keep showing the source content (Claude chat, Reddit post) as background
- Add a headlineText field to that scene: this is the large serif white heading that appears at the TOP
- Add salmonHighlightLine: the exact text from the source that gets the salmon highlight box
- Example: scene type = "claude_native", headlineText = "Cuts cost in half", salmonHighlightLine = "the exact phrase from the source that should be highlighted"

### Pattern 2: VEO CLIPS — cinematic B-roll
- Type: "veo_clip"
- These are CINEMATIC B-ROLL clips, NOT people talking to camera
- Examples: hospital monitor, blurred code screen, person typing, office environment, stressed developer, happy team
- Always describe as stock-footage-style: lighting, camera angle, motion, mood
- Indian context when humans are shown
- Duration: 3-6 seconds, used 2-4 times per video
- Use them when: transitioning between topics, illustrating a feeling/scenario, when narration says something human/emotional
- The Veo video fills the FULL 9:16 frame. Caption pill floats on top automatically.

### Pattern 3: SCREENSHOT WITH HIGHLIGHT
- Type: "screenshot" (for web pages) or "reddit_native" / "claude_native" (for those UIs)
- Add salmonHighlightLine: exact quote from the visible content that gets a salmon box
- The highlight draws the eye to the key information being narrated
- Screenshots scroll slowly if screenshotScrollPx is set

### Pattern 4: CENTERED CLIP WITH BLACK BARS (for emotional human moments)
- Type: "veo_clip" with "clipStyle": "centered"
- Shows the video clip in a centered box with black bars top/bottom (cinematic feel)
- Large italic serif word overlaid ON the clip (e.g., "you" or "worried")
- Use only for very emotional/personal moments

### Pattern 5: CAPTION PILLS
- Always auto-added by the system — you don't need to specify them
- They show synced words at the bottom (dark pill, white text)
- Keep your "caption" field short (2-4 words max, the key phrase for that moment)

## SCENE TYPES AVAILABLE
- veo_clip: cinematic B-roll video (use for human/emotional/contextual moments)
- claude_native: Claude.ai dark UI (with optional headlineText + salmonHighlightLine)
- reddit_native: Reddit post UI (with optional headlineText + salmonHighlightLine)
- screenshot: any website screenshot (with optional textOverlay label + salmonHighlightLine)
- terminal: command line, green on black
- data_table: comparison table with numbers
- beige_illustration: Imagen-generated illustration on beige background (for abstract concepts only)

## WORD INDEX RULES
- Count every word in the script starting from 0 (ignore punctuation as separate tokens)
- Each scene must cover exactly the words spoken during it — no gaps, no overlaps
- Short dramatic scenes (veo_clip, stat overlay) = 3-8 words
- Longer scenes (screenshot, claude_native) = 6-15 words

## ZOOM CONFIGS (always include)
- veo_clip: { fromScale: 1.0, toScale: 1.06, focusX: 0.5, focusY: 0.35 } // subtle face zoom
- reddit_native / screenshot: { fromScale: 1.0, toScale: 1.18, focusX: 0.5, focusY: 0.4 } // zoom to key line
- claude_native with stat: { fromScale: 1.0, toScale: 1.12, focusX: 0.5, focusY: 0.5 }
- terminal: { fromScale: 1.05, toScale: 1.0, focusX: 0.5, focusY: 0.5 } // zoom out reveal

## OUTPUT: Return ONLY valid JSON. No markdown. No explanation.

{
  "topic": "string",
  "narrationScript": "exact script passed in",
  "scenes": [
    {
      "id": "s01_descriptive_slug",
      "type": "veo_clip | claude_native | reddit_native | screenshot | terminal | data_table | beige_illustration",
      "startWordIndex": 0,
      "endWordIndex": 5,
      "durationSeconds": 3,
      "caption": "short caption",

      // veo_clip fields:
      "veoPrompt": "Cinematic description. Indian context if human. Lighting. Motion. Mood. 8 seconds. 9:16 vertical.",
      "clipStyle": "fullbleed",   // or "centered" for emotional moments

      // claude_native fields:
      "chatData": {
        "messages": [
          {"role": "user", "text": "user message"},
          {"role": "assistant", "text": "assistant response text"}
        ],
        "model": "claude-opus-4-5"
      },
      "headlineText": "Big claim here",             // optional: large serif heading at top
      "salmonHighlightLine": "phrase to highlight", // optional: this exact text gets salmon box

      // reddit_native fields:
      "redditData": {
        "subreddit": "r/ClaudeAI",
        "username": "u/username",
        "timeAgo": "2d",
        "title": "Post title here",
        "bodyLines": ["body line 1", "body line 2"],
        "upvotes": 234,
        "comments": 45
      },
      "headlineText": "optional serif headline",
      "salmonHighlightLine": "exact text to highlight",

      // screenshot fields:
      "screenshotUrl": "https://...",
      "screenshotScrollPx": 0,
      "textOverlay": "Floating label text",  // short label shown over the screenshot

      // terminal fields:
      "terminalLines": ["$ npm install caveman-claude", "✓ Installed in 2.3s"],
      "terminalHighlightLine": 0,

      // data_table fields:
      "tableData": {
        "title": "Token Comparison",
        "rows": [
          {"task": "Code review", "normal": 1200, "caveman": 280, "saved": "77%"}
        ],
        "highlightRow": 0
      },

      // beige_illustration fields:
      "imagenPrompt": "Minimalist line art. Indian context. Beige background. No text.",
      "textOverlay": "Short concept label",

      "zoom": { "fromScale": 1.0, "toScale": 1.1, "focusX": 0.5, "focusY": 0.5 }
    }
  ]
}`;

export interface GeneratedSpec {
  topic: string;
  narrationScript: string;
  scenes: Scene[];
}

export async function generateSpecFromScript(
  script: string,
  topic: string,
  hints?: string
): Promise<GeneratedSpec> {
  console.log(`🧠  Generating spec from script (${script.split(" ").length} words)...`);

  const userMessage = `Topic: ${topic}

Script:
${script}

${hints ? `Extra context: ${hints}\n` : ""}Rules to follow strictly:
1. Never show a stat/number on a standalone empty screen — use headlineText overlay on claude_native or reddit_native
2. Include at least 2 veo_clip scenes for cinematic B-roll (human/contextual moments)
3. Every screenshot needs a textOverlay or salmonHighlightLine
4. Word indices must be sequential, covering every single word
5. Minimum 10 scenes, maximum 20 scenes
6. No scene should be visually empty`;

  const response = await client.messages.create({
    model: "claude-opus-4-6",
    max_tokens: 8000,
    system: EDITING_SYSTEM_PROMPT,
    messages: [{ role: "user", content: userMessage }],
  });

  const rawText = response.content[0].type === "text" ? response.content[0].text : "";

  const jsonMatch = rawText.match(/\{[\s\S]*\}/);
  if (!jsonMatch) {
    console.error("Raw response:", rawText.slice(0, 500));
    throw new Error("Spec generator returned no valid JSON");
  }

  let spec: GeneratedSpec;
  try {
    spec = JSON.parse(jsonMatch[0]);
  } catch (e) {
    console.error("Failed to parse spec JSON:", jsonMatch[0].slice(0, 500));
    throw new Error(`Spec JSON parse error: ${(e as Error).message}`);
  }

  spec.narrationScript = script;
  spec.topic = topic;

  console.log(`✅  Generated ${spec.scenes.length} scenes:`);
  spec.scenes.forEach((s, i) => {
    const extras = [
      (s as any).headlineText ? `headline="${(s as any).headlineText}"` : "",
      (s as any).veoPrompt ? `veo` : "",
      (s as any).salmonHighlightLine ? `salmon` : "",
    ].filter(Boolean).join(" ");
    console.log(`   ${String(i + 1).padStart(2)}. [${s.type.padEnd(18)}] ${s.id.padEnd(30)} words[${s.startWordIndex ?? "?"}→${s.endWordIndex ?? "?"}] ${extras}`);
  });

  return spec;
}
