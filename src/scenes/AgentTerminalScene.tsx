import React from "react";
import {
  AbsoluteFill,
  useCurrentFrame,
  useVideoConfig,
  interpolate,
  spring,
} from "remotion";
import { FONTS } from "../lib/constants";
import { Scene } from "../../orchestrator/types";

interface Props {
  scene: Scene;
}

interface AgentLine {
  agent: string;
  color: string;
  text: string;
  startSec: number;
}

/**
 * AgentTerminalScene — terminal-style multi-agent reasoning visualization.
 *
 * Used at b25: "Deep reasoning?" — implying Claude's reasoning involves
 * multiple parallel thinking processes / agent calls.
 *
 * Visual: a black-and-green terminal pane with stacked agent log lines, each
 * line prefixed with a different agent label (in different brand colors) and a
 * task description. Lines appear staggered like a real concurrent log stream.
 *
 * Three "agents" running in parallel:
 *   [planner]      — orange (Anthropic brand) — high-level reasoning
 *   [search]       — cyan — looking up information
 *   [verifier]     — green — checking conclusions
 *
 * Final state: a "synthesizing answer..." spinner at the bottom.
 */
export const AgentTerminalScene: React.FC<Props> = ({ scene }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const t = frame / fps;

  const headerAppear = spring({ frame, fps, config: { damping: 22, stiffness: 90 } });

  const lines: AgentLine[] = (scene as any).agentLogs ?? [
    { agent: "planner",  color: "#FF8A65", text: "decompose: 3 sub-problems",                       startSec: 0.05 },
    { agent: "search",   color: "#3DDCC9", text: "fetching: 'rsp safety policy'",                   startSec: 0.20 },
    { agent: "planner",  color: "#FF8A65", text: "branch_a: capability scaling analysis",           startSec: 0.35 },
    { agent: "verifier", color: "#00FF88", text: "validating: claim-1 against source docs",        startSec: 0.50 },
    { agent: "search",   color: "#3DDCC9", text: "fetching: 'avatar iv generation refusal'",       startSec: 0.65 },
    { agent: "planner",  color: "#FF8A65", text: "branch_b: deepfake risk surface analysis",       startSec: 0.80 },
    { agent: "verifier", color: "#00FF88", text: "validating: 4 / 4 claims pass",                   startSec: 0.95 },
    { agent: "search",   color: "#3DDCC9", text: "ranking: 12 sources by recency × authority",     startSec: 1.10 },
    { agent: "planner",  color: "#FF8A65", text: "merge: branches a + b into final answer",        startSec: 1.25 },
  ];

  const cursorOn = Math.floor(t * 2) % 2 === 0;

  // Synth answer spinner
  const synthStart = 1.45;
  const showSynth = t >= synthStart;
  const dotIdx = Math.floor((t - synthStart) * 4) % 4;

  return (
    <AbsoluteFill style={{ backgroundColor: "#0a0c10", overflow: "hidden" }}>
      <AbsoluteFill style={{ background: "radial-gradient(ellipse at 50% 40%, #131820 0%, #0a0c10 75%)" }} />

      <AbsoluteFill style={{ padding: "80px 50px", display: "flex", flexDirection: "column", gap: 18 }}>
        {/* Header */}
        <div
          style={{
            opacity: headerAppear,
            transform: `translateY(${interpolate(headerAppear, [0, 1], [-15, 0])}px)`,
          }}
        >
          <div style={{ fontFamily: FONTS.sans, fontSize: 22, fontWeight: 700, letterSpacing: "5px", textTransform: "uppercase", color: "#3DDCC9", marginBottom: 10 }}>
            Agentic Reasoning · Live
          </div>
          <div style={{ fontFamily: FONTS.display, fontSize: 56, fontWeight: 900, letterSpacing: "-2px", color: "#fff", lineHeight: 1.0 }}>
            3 agents.
          </div>
          <div style={{ fontFamily: FONTS.display, fontSize: 56, fontWeight: 900, letterSpacing: "-2px", color: "#3DDCC9", lineHeight: 1.0 }}>
            One mind.
          </div>
        </div>

        {/* Terminal pane */}
        <div
          style={{
            background: "#0d1117",
            border: "1px solid #2a2d35",
            borderRadius: 14,
            padding: "26px 28px",
            flex: 1,
            fontFamily: FONTS.mono,
            fontSize: 22,
            lineHeight: 1.6,
            color: "#9aa0a8",
            overflow: "hidden",
            boxShadow: "0 0 40px rgba(0,0,0,0.5), inset 0 0 0 1px rgba(255,255,255,0.02)",
          }}
        >
          {/* Title bar */}
          <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 22, paddingBottom: 14, borderBottom: "1px solid #2a2d35" }}>
            <div style={{ display: "flex", gap: 8 }}>
              <div style={{ width: 12, height: 12, borderRadius: "50%", background: "#FF5E3A" }} />
              <div style={{ width: 12, height: 12, borderRadius: "50%", background: "#FFE94A" }} />
              <div style={{ width: 12, height: 12, borderRadius: "50%", background: "#00FF88" }} />
            </div>
            <div style={{ marginLeft: 12, fontSize: 16, color: "#6b7280" }}>claude-orchestrator · 3 agents · streaming</div>
          </div>

          {/* Stream lines */}
          {lines.map((l, i) => {
            const visible = t >= l.startSec;
            if (!visible) return null;
            const sinceStart = t - l.startSec;
            const typeProgress = Math.min(1, sinceStart / 0.18);
            const visibleText = l.text.slice(0, Math.floor(l.text.length * typeProgress));
            return (
              <div key={i} style={{ display: "flex", gap: 10, opacity: 0.65 + Math.min(0.35, sinceStart * 2), marginBottom: 4 }}>
                <span style={{ color: "#6b7280", fontSize: 18 }}>›</span>
                <span style={{ color: l.color, fontWeight: 700 }}>[{l.agent.padEnd(8, " ")}]</span>
                <span>{visibleText}</span>
                {typeProgress < 1 && cursorOn && <span style={{ color: l.color }}>▍</span>}
              </div>
            );
          })}

          {/* Synth answer line */}
          {showSynth && (
            <div style={{ display: "flex", gap: 10, marginTop: 16, color: "#fff" }}>
              <span style={{ color: "#6b7280", fontSize: 18 }}>›</span>
              <span style={{ color: "#FF8A65", fontWeight: 700 }}>[merge   ]</span>
              <span>synthesizing final answer{".".repeat(dotIdx + 1)}</span>
            </div>
          )}
        </div>
      </AbsoluteFill>
    </AbsoluteFill>
  );
};
