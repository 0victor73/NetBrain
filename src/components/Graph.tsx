"use client";

import dynamic from "next/dynamic";
import { useEffect, useState } from "react";
import { generateGraphData } from "@/lib/utils";
import { Note, Settings, Folder } from "@/lib/types";
import { Menu, Filter, Target, Maximize2, MousePointer2 } from "lucide-react";
import clsx from "clsx";

const ForceGraph2D = dynamic(() => import("react-force-graph-2d"), { ssr: false });

interface GraphProps {
  notes: Note[];
  folders: Folder[];
  onNodeClick: (node: any) => void;
  settings: Settings;
  onToggleMenu?: () => void;
}

export default function Graph({ notes, folders, onNodeClick, settings, onToggleMenu }: GraphProps) {
  const [graphData, setGraphData] = useState({ nodes: [], links: [] });
  const [dimensions, setDimensions] = useState({ width: 800, height: 600 });
  const [systemDark, setSystemDark] = useState(false);
  
  // Novos estados para Filtro e Foco
  const [selectedFolderId, setSelectedFolderId] = useState<string | "all">("all");
  const [focusNode, setFocusNode] = useState<any>(null);
  const [neighbors, setNeighbors] = useState<Set<string>>(new Set());
  const [isFocusModeActive, setIsFocusModeActive] = useState(false);

  useEffect(() => {
    // Filtrar notas antes de gerar dados do grafo
    const filteredNotes = selectedFolderId === "all" 
      ? notes 
      : notes.filter(n => n.folderId === selectedFolderId);

    const data = generateGraphData(filteredNotes);
    setGraphData(data as any);
    
    // Resetar foco se a nota focada sumir do filtro
    if (focusNode && !filteredNotes.find(n => n.id === focusNode.id)) {
      setFocusNode(null);
      setNeighbors(new Set());
    }
  }, [notes, selectedFolderId]);

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

  const handleInternalNodeClick = (node: any) => {
    if (isFocusModeActive) {
      if (focusNode?.id === node.id) {
        // Segundo clique no mesmo nó: Abre a nota
        onNodeClick(node);
      } else {
        // Primeiro clique ou nó diferente: Foca
        setFocusNode(node);
        const newNeighbors = new Set<string>();
        graphData.links.forEach((link: any) => {
          if (link.source.id === node.id) newNeighbors.add(link.target.id);
          if (link.target.id === node.id) newNeighbors.add(link.source.id);
        });
        setNeighbors(newNeighbors);
      }
    } else {
      onNodeClick(node);
    }
  };

  const isNodeFocused = (node: any) => {
    if (!focusNode) return true;
    return node.id === focusNode.id || neighbors.has(node.id);
  };

  const isLinkFocused = (link: any) => {
    if (!focusNode) return true;
    return link.source.id === focusNode.id || link.target.id === focusNode.id;
  };

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
          nodeCanvasObject={(node: any, ctx, globalScale) => {
            const label = node.name;
            const fontSize = 12 / globalScale;
            ctx.font = `${fontSize}px Outfit, sans-serif`;
            
            const focused = isNodeFocused(node);
            const isMainFocus = focusNode?.id === node.id;
            const alpha = focused ? 1 : 0.15;

            // Desenhar o círculo do nó
            const nodeSize = (Math.sqrt(node.val) * 2) * (isMainFocus ? 1.5 : 1);
            ctx.beginPath();
            ctx.arc(node.x, node.y, nodeSize, 0, 2 * Math.PI, false);
            
            ctx.fillStyle = focused 
              ? (node.color ?? "#8b5cf6") 
              : (isDark ? "rgba(255,255,255,0.1)" : "rgba(0,0,0,0.1)");
            ctx.fill();
            
            if (focused) {
              ctx.shadowColor = node.color ?? "#8b5cf6";
              ctx.shadowBlur = (isMainFocus ? 20 : 10) / globalScale;
            }

            // Desenhar o rótulo
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            
            const textColor = isDark ? "rgba(255,255,255,0.7)" : "rgba(0,0,0,0.7)";
            ctx.fillStyle = focused ? textColor : "transparent";
            
            if (focused && (globalScale > 1.5 || node.val > 10 || isMainFocus)) {
              ctx.fillText(label, node.x, node.y + nodeSize + fontSize + 2);
            }
            
            ctx.shadowBlur = 0;
          }}
          linkColor={(link: any) => isLinkFocused(link) ? linkColor : "transparent"}
          backgroundColor={bgColor}
          onNodeClick={handleInternalNodeClick}
          onBackgroundClick={() => { setFocusNode(null); setNeighbors(new Set()); }}
          linkWidth={(link: any) => isLinkFocused(link) ? 1.5 : 0}
          linkDirectionalParticles={(link: any) => isLinkFocused(link) ? 2 : 0}
          linkDirectionalParticleSpeed={0.005}
          d3AlphaDecay={0.02}
          d3VelocityDecay={0.3}
        />
      )}

      {/* Controles do Grafo */}
      <div className="absolute top-4 right-4 z-20 flex flex-col gap-2">
        {/* Filtro de Pasta */}
        <div className="bg-white/80 dark:bg-black/80 backdrop-blur-md rounded-2xl border border-black/10 dark:border-white/10 p-1 flex items-center shadow-xl">
          <div className="p-2 text-foreground/40">
            <Filter size={18} />
          </div>
          <select
            value={selectedFolderId}
            onChange={(e) => setSelectedFolderId(e.target.value)}
            className="bg-transparent text-sm font-medium pr-8 pl-2 py-1.5 focus:outline-none cursor-pointer text-foreground appearance-none"
            style={{ backgroundImage: 'url("data:image/svg+xml,%3Csvg xmlns=\'http://www.w3.org/2000/svg\' fill=\'none\' viewBox=\'0 0 24 24\' stroke=\'currentColor\'%3E%3Cpath stroke-linecap=\'round\' stroke-linejoin=\'round\' stroke-width=\'2\' d=\'org.w3.org/2000/svg\' d=\'M19 9l-7 7-7-7\'/%3E%3C/svg%3E")' }}
          >
            <option value="all" className="bg-white dark:bg-[#1a1a1a] text-black dark:text-white">Todas as notas</option>
            {folders.map(f => (
              <option key={f.id} value={f.id} className="bg-white dark:bg-[#1a1a1a] text-black dark:text-white">{f.name}</option>
            ))}
          </select>
        </div>

        {/* Toggle Modo Foco */}
        <button
          onClick={() => {
            setIsFocusModeActive(!isFocusModeActive);
            if (isFocusModeActive) { setFocusNode(null); setNeighbors(new Set()); }
          }}
          className={clsx(
            "flex items-center gap-2 px-4 py-2 rounded-2xl border transition-all shadow-xl font-medium text-sm backdrop-blur-md",
            isFocusModeActive 
              ? "bg-violet-600 border-violet-500 text-white shadow-violet-600/20" 
              : "bg-white/80 dark:bg-black/80 border-black/10 dark:border-white/10 text-foreground/60 hover:text-foreground"
          )}
        >
          {isFocusModeActive ? <Target size={18} /> : <MousePointer2 size={18} />}
          {isFocusModeActive ? "Foco Ativo" : "Modo Foco"}
        </button>

        {focusNode && (
          <button
            onClick={() => { setFocusNode(null); setNeighbors(new Set()); }}
            className="bg-white/80 dark:bg-black/80 backdrop-blur-md border border-black/10 dark:border-white/10 text-foreground/60 hover:text-foreground px-4 py-2 rounded-2xl text-xs font-bold transition-all shadow-xl flex items-center justify-center gap-2"
          >
            <Maximize2 size={14} /> Limpar Foco
          </button>
        )}
      </div>
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
