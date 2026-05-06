import React from "react";
import { useCurrentFrame, useVideoConfig, spring, interpolate } from "remotion";
import { COLORS, FONTS } from "../lib/constants";
import { SPRINGS } from "../lib/springConfigs";

interface TableRow {
  task: string;
  normal: number;
  caveman: number;
  saved: string; // e.g. "87%"
}

interface DataTableProps {
  rows: TableRow[];
  // Which row index to highlight (0-based). -1 = all visible, no highlight
  highlightRow?: number;
  // Reveal rows one by one
  revealMode?: boolean;
}

export const DataTable: React.FC<DataTableProps> = ({
  rows,
  highlightRow = -1,
  revealMode = false,
}) => {
  const frame = useCurrentFrame();
  const { fps, durationInFrames } = useVideoConfig();

  const framesPerRow = revealMode ? durationInFrames / rows.length : 0;
  const visibleRows = revealMode
    ? Math.min(rows.length, Math.floor(frame / framesPerRow) + 1)
    : rows.length;

  // Table entrance
  const tableEntry = spring({ frame, fps, config: SPRINGS.smooth });
  const tableOpacity = interpolate(tableEntry, [0, 1], [0, 1]);
  const tableY = interpolate(tableEntry, [0, 1], [40, 0]);

  const colWidths = ["42%", "20%", "20%", "18%"];
  const headers = ["Task", "Normal", "Caveman", "Saved"];

  return (
    <div style={{
      opacity: tableOpacity,
      transform: `translateY(${tableY}px)`,
      fontFamily: FONTS.sans,
      overflow: "hidden",
      borderRadius: 16,
      border: "1.5px solid #2a2a2a",
    }}>
      {/* Header */}
      <div style={{
        display: "flex",
        backgroundColor: "#1e1e1e",
        borderBottom: "2px solid #333",
        padding: "16px 20px",
      }}>
        {headers.map((h, i) => (
          <div key={i} style={{
            width: colWidths[i],
            fontSize: 22,
            fontWeight: 700,
            color: "#666",
            textTransform: "uppercase",
            letterSpacing: 1,
          }}>
            {h}
          </div>
        ))}
      </div>

      {/* Rows */}
      {rows.slice(0, visibleRows).map((row, i) => {
        const isHighlighted = highlightRow === i;
        const rowFrame = revealMode ? Math.max(0, frame - i * framesPerRow) : frame;
        const rowEntry = spring({ frame: rowFrame, fps, config: SPRINGS.snappy });
        const rowOpacity = interpolate(rowEntry, [0, 1], [0, 1]);
        const rowX = interpolate(rowEntry, [0, 1], [-30, 0]);

        // Highlight pulse
        const highlightPulse = isHighlighted
          ? spring({ frame, fps, config: SPRINGS.snappy })
          : 0;
        const highlightBg = isHighlighted
          ? `rgba(217, 112, 112, ${interpolate(highlightPulse, [0, 1], [0, 0.12])})`
          : i % 2 === 0 ? "#1a1a1a" : "#161616";

        return (
          <div
            key={i}
            style={{
              display: "flex",
              padding: "14px 20px",
              backgroundColor: highlightBg,
              borderLeft: isHighlighted ? `4px solid ${COLORS.coral}` : "4px solid transparent",
              borderBottom: i < rows.length - 1 ? "1px solid #222" : "none",
              opacity: rowOpacity,
              transform: `translateX(${rowX}px)`,
            }}
          >
            <div style={{ width: colWidths[0], fontSize: 22, color: isHighlighted ? "#fff" : "#aaa", fontWeight: isHighlighted ? 600 : 400 }}>
              {row.task}
            </div>
            <div style={{ width: colWidths[1], fontSize: 22, color: "#e07070", fontWeight: 600 }}>
              {row.normal.toLocaleString()}
            </div>
            <div style={{ width: colWidths[2], fontSize: 22, color: "#70c070", fontWeight: 600 }}>
              {row.caveman.toLocaleString()}
            </div>
            <div style={{
              width: colWidths[3],
              fontSize: 22,
              fontWeight: 800,
              color: isHighlighted ? COLORS.coral : "#70c070",
              backgroundColor: isHighlighted ? "rgba(217,112,112,0.2)" : "rgba(112,192,112,0.1)",
              borderRadius: 8,
              padding: "2px 10px",
              textAlign: "center" as const,
            }}>
              -{row.saved}
            </div>
          </div>
        );
      })}
    </div>
  );
};
