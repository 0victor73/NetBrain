"use client";

import { useState } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { Note, Settings } from "@/lib/types";
import { Maximize2, Edit3, Eye, Menu } from "lucide-react";
import clsx from "clsx";

interface EditorProps {
  note: Note | null;
  notes: Note[];
  updateNote: (id: string, updates: Partial<Note>) => void;
  onSelectNote: (id: string) => void;
  settings: Settings;
  onToggleMenu?: () => void;
  readOnly?: boolean;
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

export default function Editor({ note, notes, updateNote, onSelectNote, settings, onToggleMenu, readOnly = false }: EditorProps) {
  const [mode, setMode] = useState<"edit" | "preview" | "split">(readOnly ? "preview" : settings.defaultEditorMode);

  const handleWikiLinkClick = (title: string) => {
    const targetNote = notes.find(n => n.title.toLowerCase() === title.toLowerCase());
    if (targetNote) {
      onSelectNote(targetNote.id);
    }
  };

  if (!note) {
    return (
      <div className="flex-1 flex flex-col h-full bg-background overflow-hidden relative">
        <div className="absolute top-4 left-4 md:hidden">
          {onToggleMenu && (
            <button
              onClick={onToggleMenu}
              className="p-2 rounded-lg text-foreground/70 hover:bg-black/5 dark:hover:bg-white/10"
            >
              <Menu size={24} />
            </button>
          )}
        </div>
        <div className="flex-1 flex flex-col items-center justify-center text-foreground/40">
          <div className="w-16 h-16 mb-4 rounded-2xl bg-black/5 dark:bg-white/5 flex items-center justify-center border border-black/10 dark:border-white/10">
            <Edit3 size={24} />
          </div>
          <p className="text-lg">Selecione uma nota ou crie uma nova</p>
        </div>
      </div>
    );
  }

  // Pre-processamento para transformar [[Título]] em um formato que o ReactMarkdown possa renderizar como link customizado
  const processedContent = note.content.replace(/\[\[(.*?)\]\]/g, (match, title) => {
    return `[${title}](#wiki-${encodeURIComponent(title)})`;
  });

  return (
    <div className="flex-1 flex flex-col h-full bg-background overflow-hidden">
      {/* Toolbar */}
      <div className="flex items-center justify-between px-4 md:px-6 py-4 border-b border-black/5 dark:border-white/5 bg-background gap-2">
        <div className="flex items-center gap-2 flex-1">
          {onToggleMenu && (
            <button
              onClick={onToggleMenu}
              className="p-2 -ml-2 rounded-lg text-foreground/70 hover:bg-black/5 dark:hover:bg-white/10 md:hidden flex-shrink-0"
            >
              <Menu size={24} />
            </button>
          )}
          <input
            type="text"
            value={note.title}
            onChange={(e) => !readOnly && updateNote(note.id, { title: e.target.value })}
            readOnly={readOnly}
            className={clsx(
              "bg-transparent text-xl md:text-2xl font-bold text-foreground outline-none w-full placeholder:text-foreground/20",
              readOnly && "cursor-default select-text"
            )}
            placeholder="Nota sem título"
          />
        </div>

        <div className="flex items-center gap-2 bg-black/5 dark:bg-white/5 p-1 rounded-lg border border-black/10 dark:border-white/10">
          {!readOnly && (
            <>
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
            </>
          )}
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
              onChange={(e) => !readOnly && updateNote(note.id, { content: e.target.value })}
              readOnly={readOnly}
              spellCheck={settings.spellCheck}
              className={clsx(
                "w-full h-full bg-transparent text-foreground/90 p-6 resize-none outline-none leading-relaxed",
                fontFamilyMap[settings.editorFont],
                fontSizeMap[settings.fontSize],
                readOnly && "cursor-default"
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
            <ReactMarkdown 
              remarkPlugins={[remarkGfm]}
              components={{
                a: ({ node, ...props }) => {
                  if (props.href?.startsWith('#wiki-')) {
                    const title = decodeURIComponent(props.href.replace('#wiki-', ''));
                    return (
                      <span 
                        onClick={(e) => {
                          e.preventDefault();
                          handleWikiLinkClick(title);
                        }}
                        className="text-violet-500 cursor-pointer hover:underline font-bold decoration-violet-500/30 underline-offset-4"
                        title={`Navegar para: ${title}`}
                      >
                        {props.children}
                      </span>
                    );
                  }
                  return <a {...props} target="_blank" rel="noopener noreferrer" />;
                }
              }}
            >
              {processedContent}
            </ReactMarkdown>
          </div>
        )}
      </div>
    </div>
  );
}
