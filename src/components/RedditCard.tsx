import React from "react";
import { useCurrentFrame, useVideoConfig, spring, interpolate } from "remotion";
import { COLORS, FONTS } from "../lib/constants";
import { SPRINGS } from "../lib/springConfigs";

interface RedditCardProps {
  subreddit?: string;
  username?: string;
  timeAgo?: string;
  title: string;
  bodyLines?: string[];
  upvotes?: number;
  comments?: number;
  // If true, animate upvote counter from 0 to upvotes
  animateUpvotes?: boolean;
  // 0–1: which body line to highlight (for zoom scenes)
  highlightLine?: number;
}

export const RedditCard: React.FC<RedditCardProps> = ({
  subreddit = "r/ClaudeAI",
  username = "u/flatty",
  timeAgo = "4d ago",
  title,
  bodyLines = [],
  upvotes = 1100,
  comments = 507,
  animateUpvotes = false,
  highlightLine,
}) => {
  const frame = useCurrentFrame();
  const { fps, durationInFrames } = useVideoConfig();

  // Card entrance
  const cardEntry = spring({ frame, fps, config: SPRINGS.smooth });
  const cardOpacity = interpolate(cardEntry, [0, 1], [0, 1]);
  const cardY = interpolate(cardEntry, [0, 1], [60, 0]);

  // Upvote counter animation
  const displayUpvotes = animateUpvotes
    ? Math.round(interpolate(frame, [0, Math.min(durationInFrames * 0.7, 45)], [0, upvotes], {
        extrapolateRight: "clamp",
      }))
    : upvotes;

  const upvoteStr =
    displayUpvotes >= 1000
      ? `${(displayUpvotes / 1000).toFixed(1)}k`
      : String(displayUpvotes);

  return (
    <div
      style={{
        opacity: cardOpacity,
        transform: `translateY(${cardY}px)`,
        backgroundColor: "#1a1a1b",
        borderRadius: 16,
        border: "1.5px solid #343536",
        overflow: "hidden",
        fontFamily: FONTS.sans,
      }}
    >
      {/* Header */}
      <div style={{ padding: "20px 24px 12px", display: "flex", alignItems: "center", gap: 10 }}>
        {/* Subreddit icon */}
        <div style={{
          width: 36, height: 36, borderRadius: "50%",
          background: "linear-gradient(135deg, #ff4500, #ff6534)",
          display: "flex", alignItems: "center", justifyContent: "center",
          fontSize: 18, flexShrink: 0,
        }}>
          🤖
        </div>
        <div>
          <div style={{ fontSize: 22, fontWeight: 700, color: "#d7dadc" }}>{subreddit}</div>
          <div style={{ fontSize: 18, color: "#818384" }}>
            {username} · {timeAgo}
          </div>
        </div>
        {/* Flair */}
        <div style={{
          marginLeft: "auto",
          backgroundColor: "#2d2d2e",
          border: "1px solid #343536",
          borderRadius: 20,
          padding: "4px 14px",
          fontSize: 16,
          color: "#818384",
        }}>
          Other
        </div>
      </div>

      {/* Title */}
      <div style={{
        padding: "0 24px 16px",
        fontSize: 30,
        fontWeight: 700,
        color: "#d7dadc",
        lineHeight: 1.35,
      }}>
        {title}
      </div>

      {/* Body */}
      {bodyLines.length > 0 && (
        <div style={{ padding: "0 24px 16px" }}>
          {bodyLines.map((line, i) => (
            <div
              key={i}
              style={{
                fontSize: 22,
                color: i === highlightLine ? "#ffffff" : "#9b9b9b",
                lineHeight: 1.6,
                padding: "3px 0",
                backgroundColor: i === highlightLine ? "rgba(255,69,0,0.15)" : "transparent",
                borderLeft: i === highlightLine ? "3px solid #ff4500" : "none",
                paddingLeft: i === highlightLine ? 10 : 0,
                borderRadius: i === highlightLine ? 4 : 0,
                fontFamily: line.startsWith('"') ? FONTS.mono : FONTS.sans,
                fontWeight: line.includes("%") || line.includes("token") ? 600 : 400,
              }}
            >
              {line}
            </div>
          ))}
        </div>
      )}

      {/* Footer */}
      <div style={{
        padding: "12px 24px",
        borderTop: "1px solid #343536",
        display: "flex",
        alignItems: "center",
        gap: 20,
      }}>
        {/* Upvote section */}
        <div style={{
          display: "flex", alignItems: "center", gap: 8,
          backgroundColor: "#272729",
          borderRadius: 20,
          padding: "8px 16px",
        }}>
          <span style={{ fontSize: 22, color: "#ff4500" }}>▲</span>
          <span style={{ fontSize: 22, fontWeight: 700, color: "#ff4500" }}>{upvoteStr}</span>
          <span style={{ fontSize: 22, color: "#818384" }}>▼</span>
        </div>

        {/* Comments */}
        <div style={{
          display: "flex", alignItems: "center", gap: 8,
          backgroundColor: "#272729",
          borderRadius: 20,
          padding: "8px 16px",
        }}>
          <span style={{ fontSize: 20 }}>💬</span>
          <span style={{ fontSize: 20, color: "#d7dadc" }}>{comments}</span>
        </div>

        {/* Share */}
        <div style={{
          display: "flex", alignItems: "center", gap: 8,
          backgroundColor: "#272729",
          borderRadius: 20,
          padding: "8px 16px",
        }}>
          <span style={{ fontSize: 20, color: "#818384" }}>⬆ Share</span>
        </div>
      </div>
    </div>
  );
};
