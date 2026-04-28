"use client";

import { useState } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { Note } from "@/lib/types";
import { Maximize2, Minimize2, Edit3, Eye } from "lucide-react";
import clsx from "clsx";

interface EditorProps {
  note: Note | null;
  updateNote: (id: string, updates: Partial<Note>) => void;
}

export default function Editor({ note, updateNote }: EditorProps) {
  const [mode, setMode] = useState<"edit" | "preview" | "split">("split");

  if (!note) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center bg-[#0a0a0a] text-white/40">
        <div className="w-16 h-16 mb-4 rounded-2xl bg-white/5 flex items-center justify-center border border-white/10">
          <Edit3 size={24} />
        </div>
        <p className="text-lg">Select a note or create a new one</p>
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col h-full bg-[#0a0a0a] overflow-hidden">
      <div className="flex items-center justify-between px-6 py-4 border-b border-white/5 bg-[#0a0a0a]">
        <input
          type="text"
          value={note.title}
          onChange={(e) => updateNote(note.id, { title: e.target.value })}
          className="bg-transparent text-2xl font-bold text-white outline-none w-1/2 placeholder:text-white/20"
          placeholder="Untitled Note"
        />
        
        <div className="flex items-center gap-2 bg-white/5 p-1 rounded-lg border border-white/10">
          <button
            onClick={() => setMode("edit")}
            className={clsx(
              "p-2 rounded-md transition-colors",
              mode === "edit" ? "bg-white/10 text-white" : "text-white/50 hover:text-white"
            )}
            title="Edit"
          >
            <Edit3 size={16} />
          </button>
          <button
            onClick={() => setMode("split")}
            className={clsx(
              "p-2 rounded-md transition-colors",
              mode === "split" ? "bg-white/10 text-white" : "text-white/50 hover:text-white"
            )}
            title="Split View"
          >
            <Maximize2 size={16} />
          </button>
          <button
            onClick={() => setMode("preview")}
            className={clsx(
              "p-2 rounded-md transition-colors",
              mode === "preview" ? "bg-white/10 text-white" : "text-white/50 hover:text-white"
            )}
            title="Preview"
          >
            <Eye size={16} />
          </button>
        </div>
      </div>

      <div className="flex-1 flex overflow-hidden">
        {(mode === "edit" || mode === "split") && (
          <div className={clsx("h-full", mode === "split" ? "w-1/2 border-r border-white/5" : "w-full")}>
            <textarea
              value={note.content}
              onChange={(e) => updateNote(note.id, { content: e.target.value })}
              className="w-full h-full bg-transparent text-white/90 p-6 resize-none outline-none font-mono text-sm leading-relaxed"
              placeholder="Start writing... Use [[Note Title]] to link notes."
            />
          </div>
        )}
        
        {(mode === "preview" || mode === "split") && (
          <div className={clsx("h-full overflow-y-auto p-6 prose prose-invert max-w-none", mode === "split" ? "w-1/2" : "w-full")}>
            <ReactMarkdown remarkPlugins={[remarkGfm]}>
              {note.content}
            </ReactMarkdown>
          </div>
        )}
      </div>
    </div>
  );
}
