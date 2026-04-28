"use client";

import dynamic from "next/dynamic";
import { useEffect, useState } from "react";
import { generateGraphData } from "@/lib/utils";
import { Note } from "@/lib/types";

const ForceGraph2D = dynamic(() => import("react-force-graph-2d"), { ssr: false });

interface GraphProps {
  notes: Note[];
  onNodeClick: (node: any) => void;
}

export default function Graph({ notes, onNodeClick }: GraphProps) {
  const [graphData, setGraphData] = useState({ nodes: [], links: [] });
  const [dimensions, setDimensions] = useState({ width: 800, height: 600 });

  useEffect(() => {
    setGraphData(generateGraphData(notes) as any);
  }, [notes]);

  useEffect(() => {
    const updateDimensions = () => {
      const container = document.getElementById("graph-container");
      if (container) {
        setDimensions({
          width: container.clientWidth,
          height: container.clientHeight,
        });
      }
    };
    updateDimensions();
    window.addEventListener("resize", updateDimensions);
    return () => window.removeEventListener("resize", updateDimensions);
  }, []);

  return (
    <div id="graph-container" className="w-full h-full flex-1 bg-[#121212] rounded-xl overflow-hidden shadow-2xl border border-white/5 relative">
      {typeof window !== "undefined" && (
        <ForceGraph2D
          width={dimensions.width}
          height={dimensions.height}
          graphData={graphData}
          nodeLabel="name"
          nodeColor={() => "#8b5cf6"}
          linkColor={() => "#4c1d95"}
          backgroundColor="#121212"
          onNodeClick={onNodeClick}
          nodeRelSize={6}
          linkWidth={2}
          linkDirectionalParticles={2}
          linkDirectionalParticleSpeed={0.005}
        />
      )}
      <div className="absolute top-4 left-4 text-white/50 text-sm font-medium tracking-wider uppercase">
        Knowledge Graph
      </div>
    </div>
  );
}
