import React from "react";
import { AbsoluteFill } from "remotion";
import { RedditCard } from "../components/RedditCard";
import { COLORS, WIDTH, HEIGHT, SAFE_AREA } from "../lib/constants";
import { Scene } from "../../orchestrator/types";

interface RedditSceneProps { scene: Scene; }

export const RedditScene: React.FC<RedditSceneProps> = ({ scene }) => {
  const d = scene.redditData ?? {
    title: "Taught Claude to talk like a caveman to use 75% less tokens.",
    bodyLines: [],
    upvotes: 1100,
    animateUpvotes: false,
  };

  return (
    <AbsoluteFill style={{ backgroundColor: "#0d0d0d", justifyContent: "center", padding: `${SAFE_AREA.top}px ${SAFE_AREA.left}px` }}>
      <RedditCard
        subreddit={d.subreddit ?? "r/ClaudeAI"}
        username={d.username ?? "u/flatty"}
        timeAgo={d.timeAgo ?? "4d ago"}
        title={d.title}
        bodyLines={d.bodyLines ?? []}
        upvotes={d.upvotes ?? 1100}
        comments={d.comments ?? 507}
        animateUpvotes={d.animateUpvotes ?? false}
        highlightLine={d.highlightLine}
      />
    </AbsoluteFill>
  );
};
