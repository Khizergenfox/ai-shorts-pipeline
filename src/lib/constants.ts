// Canvas dimensions — 9:16 vertical shorts format
export const WIDTH = 1080;
export const HEIGHT = 1920;
export const FPS = 30;

// Modern, high-contrast palette tuned for AI/business shorts.
// Punchier than the old muted-coral-on-gray scheme.
export const COLORS = {
  // Backgrounds
  bgDark: "#0a0a0a",      // near-black, deeper than #1a1a1a — more cinematic
  bgOlive: "#13160e",
  bgLight: "#f5f1e3",     // warm off-white
  bgPanel: "#161616",     // surfaces / cards

  // Accents — vibrant, viral-short energy
  accent: "#FF5E3A",      // electric coral (warmer, more saturated than old #d97070)
  accentSoft: "#FF8A65",
  highlight: "#FFE94A",   // karaoke highlight — readable yellow
  cyan: "#3DDCC9",        // secondary accent, complements coral
  green: "#00FF88",
  pink: "#FF2D78",

  // Neutrals
  white: "#ffffff",
  offWhite: "#f4f4f5",
  gray: "#9ca3af",
  grayDark: "#3f3f46",

  // Legacy aliases (kept so older scenes don't break)
  coral: "#FF5E3A",
  coralLight: "#FF8A65",
  captionBg: "rgba(10, 10, 10, 0.0)",  // captions are now stroke-based, no pill bg
};

// Typography — sourced from src/lib/fonts.ts (loaded via @remotion/google-fonts)
// Re-exported here so existing code that imports FONTS from constants keeps working.
export const FONTS = {
  sans: "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
  display: "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
  mono: "'JetBrains Mono', 'Fira Code', 'Courier New', monospace",
};

// Modern karaoke captions — big, bold, stroked, no pill background
export const CAPTION = {
  fontSize: 88,            // was 42 — viral-short scale
  fontWeight: 900,         // Inter Black
  lineHeight: 1.05,
  letterSpacing: "-2px",
  strokeWidth: 12,         // thick black stroke for legibility on any bg
  strokeColor: "#000000",
  textColor: "#ffffff",
  highlightColor: "#FFE94A", // active word color
  maxWidth: 940,
  // Vertical position: 60% from top puts captions in the visual center,
  // safely above TikTok/Reels UI chrome at the bottom.
  verticalAnchor: 0.62,
};

// Safe area padding for mobile (accounts for notch/home bar)
export const SAFE_AREA = {
  top: 80,
  bottom: 220,  // larger so captions don't collide with TikTok UI
  left: 40,
  right: 40,
};
