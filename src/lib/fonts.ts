import { loadFont as loadInter } from "@remotion/google-fonts/Inter";
import { loadFont as loadAnton } from "@remotion/google-fonts/Anton";

const { fontFamily: interFamily } = loadInter("normal", {
  weights: ["500", "600", "700", "800", "900"],
});

// Anton — heavy condensed sans for MrBeast/Aevy-style word captions
const { fontFamily: antonFamily } = loadAnton("normal", {
  weights: ["400"],
});

export const FONT_FAMILY = {
  display: interFamily,
  sans: interFamily,
  mono: "'JetBrains Mono', 'Fira Code', 'Courier New', monospace",
  caption: antonFamily,
};
