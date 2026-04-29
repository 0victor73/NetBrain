"use client";

import dynamic from "next/dynamic";
import { useEffect, useState } from "react";
import { generateGraphData } from "@/lib/utils";
import { Note, Settings } from "@/lib/types";
import { Menu } from "lucide-react";

const ForceGraph2D = dynamic(() => import("react-force-graph-2d"), { ssr: false });

interface GraphProps {
  notes: Note[];
  onNodeClick: (node: any) => void;
  settings: Settings;
  onToggleMenu?: () => void;
}

export default function Graph({ notes, onNodeClick, settings, onToggleMenu }: GraphProps) {
  const [graphData, setGraphData] = useState({ nodes: [], links: [] });
  const [dimensions, setDimensions] = useState({ width: 800, height: 600 });
  const [systemDark, setSystemDark] = useState(false);

  useEffect(() => {
    setGraphData(generateGraphData(notes) as any);
  }, [notes]);

  useEffect(() => {
    // Track system dark mode only as fallback for "system" theme setting
    const mq = window.matchMedia("(prefers-color-scheme: dark)");
    setSystemDark(mq.matches);
    const handler = (e: MediaQueryListEvent) => setSystemDark(e.matches);
    mq.addEventListener("change", handler);

    const updateDimensions = () => {
      const container = document.getElementById("graph-container");
      if (container) {
        setDimensions({ width: container.clientWidth, height: container.clientHeight });
      }
    };
    updateDimensions();
    window.addEventListener("resize", updateDimensions);
    return () => {
      window.removeEventListener("resize", updateDimensions);
      mq.removeEventListener("change", handler);
    };
  }, []);

  // Resolve the effective dark mode based on settings (same logic as useSettings)
  const isDark =
    settings.theme === "dark" ||
    (settings.theme === "system" && systemDark);

  const bgColor = isDark ? "#121212" : "#f9fafb";
  const linkColor = isDark ? "rgba(255,255,255,0.25)" : "rgba(0,0,0,0.25)";

  return (
    <div
      id="graph-container"
      className="w-full h-full flex-1 overflow-hidden relative border-l border-black/5 dark:border-white/5"
      style={{ background: bgColor }}
    >
      <div className="absolute top-4 left-4 z-10 md:hidden">
        {onToggleMenu && (
          <button
            onClick={onToggleMenu}
            className="p-2 bg-white/80 dark:bg-black/80 backdrop-blur-sm rounded-lg border border-black/10 dark:border-white/10 text-foreground/70 hover:text-foreground shadow-sm"
          >
            <Menu size={24} />
          </button>
        )}
      </div>

      {typeof window !== "undefined" && (
        <ForceGraph2D
          width={dimensions.width}
          height={dimensions.height}
          graphData={graphData}
          nodeLabel="name"
          nodeColor={(node: any) => node.color ?? "#8b5cf6"}
          linkColor={() => linkColor}
          backgroundColor={bgColor}
          onNodeClick={onNodeClick}
          nodeRelSize={6}
          linkWidth={2}
          linkDirectionalParticles={2}
          linkDirectionalParticleSpeed={0.005}
        />
      )}
      <div
        className="absolute top-4 left-4 text-sm font-medium tracking-wider uppercase px-3 py-1 rounded-md backdrop-blur-sm pointer-events-none"
        style={{
          color: isDark ? "rgba(255,255,255,0.4)" : "rgba(0,0,0,0.4)",
          background: isDark ? "rgba(0,0,0,0.3)" : "rgba(255,255,255,0.6)",
        }}
      >
        Mapa de Conhecimento
      </div>
    </div>
  );
}
