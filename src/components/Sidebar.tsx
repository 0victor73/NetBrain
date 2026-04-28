"use client";

import { Note } from "@/lib/types";
import { Plus, Search, FileText, Network, Trash2 } from "lucide-react";
import clsx from "clsx";
import { useState } from "react";

interface SidebarProps {
  notes: Note[];
  activeNoteId: string | null;
  onSelectNote: (id: string) => void;
  onCreateNote: () => void;
  onDeleteNote: (id: string) => void;
  showGraph: boolean;
  setShowGraph: (show: boolean) => void;
}

export default function Sidebar({
  notes,
  activeNoteId,
  onSelectNote,
  onCreateNote,
  onDeleteNote,
  showGraph,
  setShowGraph,
}: SidebarProps) {
  const [search, setSearch] = useState("");

  const filteredNotes = notes.filter(
    (n) =>
      n.title.toLowerCase().includes(search.toLowerCase()) ||
      n.content.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="w-72 h-full bg-[#121212] border-r border-white/5 flex flex-col">
      <div className="p-4 flex items-center justify-between">
        <div className="flex items-center gap-2 text-white font-semibold">
          <div className="w-6 h-6 rounded bg-violet-600 flex items-center justify-center">
            <Network size={14} className="text-white" />
          </div>
          NetBrain
        </div>
        <div className="flex items-center gap-1">
          <button
            onClick={() => setShowGraph(!showGraph)}
            className={clsx(
              "p-1.5 rounded-md transition-colors",
              showGraph ? "bg-violet-600/20 text-violet-400" : "text-white/50 hover:text-white hover:bg-white/5"
            )}
            title="Toggle Graph View"
          >
            <Network size={16} />
          </button>
          <button
            onClick={onCreateNote}
            className="p-1.5 rounded-md text-white/50 hover:text-white hover:bg-white/5 transition-colors"
            title="New Note"
          >
            <Plus size={16} />
          </button>
        </div>
      </div>

      <div className="px-4 pb-4">
        <div className="relative">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-white/30" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search notes..."
            className="w-full bg-white/5 border border-white/10 rounded-lg pl-9 pr-4 py-1.5 text-sm text-white placeholder:text-white/30 outline-none focus:border-violet-500/50 transition-colors"
          />
        </div>
      </div>

      <div className="flex-1 overflow-y-auto px-2 space-y-0.5">
        {filteredNotes.map((note) => (
          <div
            key={note.id}
            onClick={() => onSelectNote(note.id)}
            className={clsx(
              "group flex items-center justify-between px-3 py-2 rounded-lg cursor-pointer transition-colors",
              activeNoteId === note.id && !showGraph
                ? "bg-violet-600/10 text-violet-300"
                : "text-white/70 hover:bg-white/5 hover:text-white"
            )}
          >
            <div className="flex items-center gap-3 truncate">
              <FileText size={14} className={activeNoteId === note.id && !showGraph ? "text-violet-400" : "text-white/30"} />
              <span className="truncate text-sm font-medium">
                {note.title || "Untitled Note"}
              </span>
            </div>
            <button
              onClick={(e) => {
                e.stopPropagation();
                onDeleteNote(note.id);
              }}
              className="opacity-0 group-hover:opacity-100 p-1 text-white/30 hover:text-red-400 transition-all"
            >
              <Trash2 size={14} />
            </button>
          </div>
        ))}
        {filteredNotes.length === 0 && (
          <div className="text-center py-8 text-white/30 text-sm">
            No notes found
          </div>
        )}
      </div>
    </div>
  );
}
