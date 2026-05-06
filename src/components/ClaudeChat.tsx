import React from "react";
import { useCurrentFrame, useVideoConfig, spring, interpolate } from "remotion";
import { COLORS, FONTS } from "../lib/constants";
import { SPRINGS } from "../lib/springConfigs";

interface Message {
  role: "user" | "assistant";
  text: string;
  // If true, scroll this message into view
  scrollable?: boolean;
}

interface ClaudeChatProps {
  messages: Message[];
  model?: string;
  revealMode?: boolean;
  // If set, highlight this exact text substring with a salmon (#E8907A) background box
  salmonHighlightLine?: string;
}

/** Splits text and wraps the matching substring in a salmon highlight span */
function renderWithHighlight(text: string, highlight?: string): React.ReactNode {
  if (!highlight) return text;
  const idx = text.indexOf(highlight);
  if (idx === -1) return text;
  return (
    <>
      {text.slice(0, idx)}
      <span
        style={{
          backgroundColor: "#E8907A",
          color: "#1a1a1a",
          borderRadius: 4,
          padding: "2px 6px",
          fontWeight: 600,
        }}
      >
        {highlight}
      </span>
      {text.slice(idx + highlight.length)}
    </>
  );
}

export const ClaudeChat: React.FC<ClaudeChatProps> = ({
  messages,
  model = "Claude Sonnet 4.6",
  revealMode = false,
  salmonHighlightLine,
}) => {
  const frame = useCurrentFrame();
  const { fps, durationInFrames } = useVideoConfig();

  const framesPerMessage = revealMode ? durationInFrames / messages.length : 0;
  const visibleCount = revealMode
    ? Math.min(messages.length, Math.floor(frame / framesPerMessage) + 1)
    : messages.length;

  return (
    <div
      style={{
        backgroundColor: "#1e1e1e",
        borderRadius: 20,
        overflow: "hidden",
        border: "1.5px solid #2a2a2a",
        fontFamily: FONTS.sans,
        display: "flex",
        flexDirection: "column",
      }}
    >
      {/* Header bar */}
      <div style={{
        backgroundColor: "#252525",
        padding: "16px 24px",
        borderBottom: "1px solid #2a2a2a",
        display: "flex",
        alignItems: "center",
        gap: 12,
      }}>
        {/* Claude logo circle */}
        <div style={{
          width: 32, height: 32, borderRadius: "50%",
          background: "linear-gradient(135deg, #d97070, #c45050)",
          display: "flex", alignItems: "center", justifyContent: "center",
          fontSize: 16,
        }}>
          C
        </div>
        <span style={{ color: "#a0a0a0", fontSize: 20, fontWeight: 600 }}>{model}</span>
        <div style={{
          marginLeft: "auto",
          backgroundColor: "#1a1a1a",
          borderRadius: 8,
          padding: "4px 12px",
          fontSize: 17,
          color: "#d97070",
        }}>
          Extended Thinking
        </div>
      </div>

      {/* Messages */}
      <div style={{ padding: "20px 24px", display: "flex", flexDirection: "column", gap: 16 }}>
        {messages.slice(0, visibleCount).map((msg, i) => {
          const msgFrame = revealMode ? Math.max(0, frame - i * framesPerMessage) : frame;
          const entryProg = spring({ frame: msgFrame, fps, config: SPRINGS.snappy });
          const opacity = interpolate(entryProg, [0, 1], [0, 1]);
          const ty = interpolate(entryProg, [0, 1], [20, 0]);

          return (
            <div
              key={i}
              style={{
                opacity,
                transform: `translateY(${ty}px)`,
                display: "flex",
                flexDirection: msg.role === "user" ? "row-reverse" : "row",
                gap: 12,
                alignItems: "flex-start",
              }}
            >
              {/* Avatar */}
              <div style={{
                width: 36, height: 36, borderRadius: "50%", flexShrink: 0,
                backgroundColor: msg.role === "user" ? "#3a3a3a" : "#2d1f1f",
                border: msg.role === "assistant" ? `2px solid ${COLORS.coral}` : "2px solid #555",
                display: "flex", alignItems: "center", justifyContent: "center",
                fontSize: 16,
              }}>
                {msg.role === "user" ? "👤" : "C"}
              </div>

              {/* Bubble */}
              <div style={{
                backgroundColor: msg.role === "user" ? "#2d2d2d" : "#252525",
                borderRadius: msg.role === "user" ? "18px 4px 18px 18px" : "4px 18px 18px 18px",
                padding: "14px 18px",
                maxWidth: "85%",
                border: msg.role === "assistant" ? "1px solid #333" : "none",
              }}>
                <div style={{
                  fontSize: msg.text.length < 10 ? 52 : 22,
                  fontWeight: msg.text.length < 10 ? 800 : 400,
                  color: msg.role === "user" ? "#e0e0e0" : "#c8c8c8",
                  lineHeight: 1.6,
                  fontFamily: FONTS.sans,
                }}>
                  {msg.role === "assistant"
                    ? renderWithHighlight(msg.text, salmonHighlightLine)
                    : msg.text}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
