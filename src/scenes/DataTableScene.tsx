import React from "react";
import { AbsoluteFill } from "remotion";
import { DataTable } from "../components/DataTable";
import { COLORS, FONTS, SAFE_AREA } from "../lib/constants";
import { Scene } from "../../orchestrator/types";

const BENCHMARK_ROWS = [
  { task: "React re-render bug", normal: 1180, caveman: 159, saved: "87%" },
  { task: "Fix auth middleware", normal: 704, caveman: 121, saved: "83%" },
  { task: "PostgreSQL conn pool", normal: 2347, caveman: 380, saved: "84%" },
  { task: "git rebase vs merge", normal: 702, caveman: 292, saved: "58%" },
  { task: "Callback → async/await", normal: 387, caveman: 301, saved: "22%" },
];

interface DataTableSceneProps { scene: Scene; }

export const DataTableScene: React.FC<DataTableSceneProps> = ({ scene }) => {
  const data = scene.tableData ?? {};

  return (
    <AbsoluteFill style={{
      backgroundColor: "#111",
      padding: `${SAFE_AREA.top}px ${SAFE_AREA.left}px`,
      justifyContent: "center",
    }}>
      {/* Title */}
      <div style={{
        fontFamily: FONTS.sans,
        fontSize: 36,
        fontWeight: 800,
        color: COLORS.coral,
        marginBottom: 24,
        textAlign: "center" as const,
      }}>
        {data.title ?? "Real benchmark data"}
      </div>

      <DataTable
        rows={data.rows ?? BENCHMARK_ROWS}
        highlightRow={data.highlightRow ?? -1}
        revealMode={data.revealMode ?? false}
      />
    </AbsoluteFill>
  );
};
