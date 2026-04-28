"use client";

import { useState } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { Note, Settings } from "@/lib/types";
import { Maximize2, Edit3, Eye } from "lucide-react";
import clsx from "clsx";

interface EditorProps {
  note: Note | null;
  updateNote: (id: string, updates: Partial<Note>) => void;
  settings: Settings;
}

const fontFamilyMap = {
  mono: "font-mono",
  sans: "font-sans",
  serif: "font-serif",
};

const fontSizeMap = {
  sm: "text-sm",
  base: "text-base",
  lg: "text-lg",
};

export default function Editor({ note, updateNote, settings }: EditorProps) {
  const [mode, setMode] = useState<"edit" | "preview" | "split">(settings.defaultEditorMode);

  if (!note) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center bg-background text-foreground/40">
        <div className="w-16 h-16 mb-4 rounded-2xl bg-black/5 dark:bg-white/5 flex items-center justify-center border border-black/10 dark:border-white/10">
          <Edit3 size={24} />
        </div>
        <p className="text-lg">Selecione uma nota ou crie uma nova</p>
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col h-full bg-background overflow-hidden">
      {/* Toolbar */}
      <div className="flex items-center justify-between px-6 py-4 border-b border-black/5 dark:border-white/5 bg-background">
        <input
          type="text"
          value={note.title}
          onChange={(e) => updateNote(note.id, { title: e.target.value })}
          className="bg-transparent text-2xl font-bold text-foreground outline-none w-1/2 placeholder:text-foreground/20"
          placeholder="Nota sem título"
        />

        <div className="flex items-center gap-2 bg-black/5 dark:bg-white/5 p-1 rounded-lg border border-black/10 dark:border-white/10">
          <button
            onClick={() => setMode("edit")}
            className={clsx(
              "p-2 rounded-md transition-colors",
              mode === "edit"
                ? "bg-black/10 dark:bg-white/10 text-foreground"
                : "text-foreground/50 hover:text-foreground"
            )}
            title="Editar"
          >
            <Edit3 size={16} />
          </button>
          <button
            onClick={() => setMode("split")}
            className={clsx(
              "p-2 rounded-md transition-colors",
              mode === "split"
                ? "bg-black/10 dark:bg-white/10 text-foreground"
                : "text-foreground/50 hover:text-foreground"
            )}
            title="Visão Dividida"
          >
            <Maximize2 size={16} />
          </button>
          <button
            onClick={() => setMode("preview")}
            className={clsx(
              "p-2 rounded-md transition-colors",
              mode === "preview"
                ? "bg-black/10 dark:bg-white/10 text-foreground"
                : "text-foreground/50 hover:text-foreground"
            )}
            title="Visualizar"
          >
            <Eye size={16} />
          </button>
        </div>
      </div>

      {/* Panels */}
      <div className="flex-1 flex overflow-hidden">
        {(mode === "edit" || mode === "split") && (
          <div
            className={clsx(
              "h-full",
              mode === "split" ? "w-1/2 border-r border-black/5 dark:border-white/5" : "w-full"
            )}
          >
            <textarea
              value={note.content}
              onChange={(e) => updateNote(note.id, { content: e.target.value })}
              spellCheck={settings.spellCheck}
              className={clsx(
                "w-full h-full bg-transparent text-foreground/90 p-6 resize-none outline-none leading-relaxed",
                fontFamilyMap[settings.editorFont],
                fontSizeMap[settings.fontSize]
              )}
              placeholder="Comece a escrever... Use [[Título da Nota]] para conectar notas."
            />
          </div>
        )}

        {(mode === "preview" || mode === "split") && (
          <div
            className={clsx(
              "h-full overflow-y-auto p-6 prose dark:prose-invert max-w-none",
              mode === "split" ? "w-1/2" : "w-full"
            )}
          >
            <ReactMarkdown remarkPlugins={[remarkGfm]}>{note.content}</ReactMarkdown>
          </div>
        )}
      </div>
    </div>
  );
}
