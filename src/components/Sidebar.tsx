"use client";

import { useState, useRef, useEffect } from "react";
import { Note, Folder } from "@/lib/types";
import {
  Plus,
  Search,
  FileText,
  Network,
  Trash2,
  Settings,
  FolderPlus,
  FolderOpen,
  Folder as FolderIcon,
  ChevronRight,
  ChevronDown,
  Pencil,
  Palette,
} from "lucide-react";
import clsx from "clsx";
import ColorPicker from "@/components/ColorPicker";

interface SidebarProps {
  notes: Note[];
  folders: Folder[];
  activeNoteId: string | null;
  onSelectNote: (id: string) => void;
  onCreateNote: (folderId: string | null) => void;
  onDeleteNote: (id: string) => void;
  onUpdateNote: (id: string, updates: Partial<Note>) => void;
  onMoveNote: (noteId: string, folderId: string | null) => void;
  onCreateFolder: (parentId: string | null) => void;
  onDeleteFolder: (id: string) => void;
  onRenameFolder: (id: string, name: string) => void;
  onUpdateFolder: (id: string, updates: Partial<Folder>) => void;
  onToggleFolder: (id: string) => void;
  showGraph: boolean;
  setShowGraph: (show: boolean) => void;
  onOpenSettings: () => void;
}

/** Inline rename input */
function InlineRename({
  initialValue,
  onConfirm,
  onCancel,
}: {
  initialValue: string;
  onConfirm: (v: string) => void;
  onCancel: () => void;
}) {
  const [value, setValue] = useState(initialValue);
  const ref = useRef<HTMLInputElement>(null);
  useEffect(() => { ref.current?.focus(); ref.current?.select(); }, []);

  return (
    <input
      ref={ref}
      value={value}
      onChange={(e) => setValue(e.target.value)}
      onBlur={() => onConfirm(value)}
      onKeyDown={(e) => {
        if (e.key === "Enter") onConfirm(value);
        if (e.key === "Escape") onCancel();
        e.stopPropagation();
      }}
      onClick={(e) => e.stopPropagation()}
      className="flex-1 bg-white dark:bg-white/10 border border-violet-400/60 rounded px-1.5 py-0.5 text-sm outline-none text-foreground min-w-0"
    />
  );
}

/** Folder row (recursive) */
function FolderRow({
  folder,
  depth,
  notes,
  folders,
  activeNoteId,
  showGraph,
  renamingId,
  dragOverId,
  onSelectNote,
  onDeleteNote,
  onUpdateNote,
  onMoveNote,
  onCreateNote,
  onCreateFolder,
  onDeleteFolder,
  onRenameFolder,
  onUpdateFolder,
  onToggleFolder,
  setRenamingId,
  setDragOverId,
}: {
  folder: Folder;
  depth: number;
  notes: Note[];
  folders: Folder[];
  activeNoteId: string | null;
  showGraph: boolean;
  renamingId: string | null;
  dragOverId: string | null;
  onSelectNote: (id: string) => void;
  onDeleteNote: (id: string) => void;
  onUpdateNote: (id: string, updates: Partial<Note>) => void;
  onMoveNote: (noteId: string, folderId: string | null) => void;
  onCreateNote: (folderId: string | null) => void;
  onCreateFolder: (parentId: string | null) => void;
  onDeleteFolder: (id: string) => void;
  onRenameFolder: (id: string, name: string) => void;
  onUpdateFolder: (id: string, updates: Partial<Folder>) => void;
  onToggleFolder: (id: string) => void;
  setRenamingId: (id: string | null) => void;
  setDragOverId: (id: string | null) => void;
}) {
  const [showColorPicker, setShowColorPicker] = useState(false);
  const paletteRef = useRef<HTMLButtonElement>(null);

  const childFolders = folders.filter((f) => f.parentId === folder.id);
  const folderNotes = notes.filter((n) => n.folderId === folder.id);
  const isRenaming = renamingId === folder.id;
  const isDragOver = dragOverId === folder.id;
  const iconColor = folder.color ?? "#8b5cf6";

  const sharedChildProps = {
    notes, folders, activeNoteId, showGraph, renamingId, dragOverId,
    onSelectNote, onDeleteNote, onUpdateNote, onMoveNote,
    onCreateNote, onCreateFolder, onDeleteFolder, onRenameFolder, onUpdateFolder, onToggleFolder,
    setRenamingId, setDragOverId,
  };

  return (
    <div>
      <div
        className={clsx(
          "group flex items-center gap-1 py-1.5 pr-1 rounded-lg cursor-pointer transition-colors select-none",
          isDragOver
            ? "bg-violet-500/20 ring-1 ring-violet-400/40"
            : "hover:bg-black/5 dark:hover:bg-white/5"
        )}
        style={{ paddingLeft: `${6 + depth * 16}px` }}
        onClick={() => onToggleFolder(folder.id)}
        onDragOver={(e) => { e.preventDefault(); setDragOverId(folder.id); }}
        onDragLeave={() => setDragOverId(null)}
        onDrop={(e) => {
          e.preventDefault();
          const noteId = e.dataTransfer.getData("noteId");
          if (noteId) onMoveNote(noteId, folder.id);
          setDragOverId(null);
        }}
      >
        <span className="text-foreground/30 flex-shrink-0">
          {folder.isOpen ? <ChevronDown size={12} /> : <ChevronRight size={12} />}
        </span>
        {folder.isOpen
          ? <FolderOpen size={14} style={{ color: iconColor }} className="flex-shrink-0" />
          : <FolderIcon size={14} style={{ color: iconColor }} className="flex-shrink-0" />
        }

        {isRenaming ? (
          <InlineRename
            initialValue={folder.name}
            onConfirm={(v) => { if (v.trim()) onRenameFolder(folder.id, v.trim()); setRenamingId(null); }}
            onCancel={() => setRenamingId(null)}
          />
        ) : (
          <span
            className="truncate text-sm flex-1 font-medium"
            style={folder.color ? { color: folder.color } : { color: "inherit" }}
          >
            {folder.name}
          </span>
        )}

        {!isRenaming && (
          <div className="opacity-0 group-hover:opacity-100 flex items-center gap-0.5 flex-shrink-0">
            <button title="Nova nota" onClick={(e) => { e.stopPropagation(); onCreateNote(folder.id); }}
              className="p-1 rounded text-foreground/40 hover:text-foreground hover:bg-black/10 dark:hover:bg-white/10 transition-colors">
              <Plus size={11} />
            </button>
            <button title="Nova sub-pasta" onClick={(e) => { e.stopPropagation(); onCreateFolder(folder.id); }}
              className="p-1 rounded text-foreground/40 hover:text-foreground hover:bg-black/10 dark:hover:bg-white/10 transition-colors">
              <FolderPlus size={11} />
            </button>
            <button
              ref={paletteRef}
              title="Cor da pasta"
              onClick={(e) => { e.stopPropagation(); setShowColorPicker((v) => !v); }}
              className="p-1 rounded text-foreground/40 hover:text-foreground hover:bg-black/10 dark:hover:bg-white/10 transition-colors"
            >
              <Palette size={11} />
            </button>
            <button title="Renomear" onClick={(e) => { e.stopPropagation(); setRenamingId(folder.id); }}
              className="p-1 rounded text-foreground/40 hover:text-foreground hover:bg-black/10 dark:hover:bg-white/10 transition-colors">
              <Pencil size={11} />
            </button>
            <button title="Excluir" onClick={(e) => { e.stopPropagation(); onDeleteFolder(folder.id); }}
              className="p-1 rounded text-foreground/40 hover:text-red-500 hover:bg-black/10 dark:hover:bg-white/10 transition-colors">
              <Trash2 size={11} />
            </button>
          </div>
        )}
      </div>

      {showColorPicker && (
        <ColorPicker
          triggerRef={paletteRef}
          currentColor={folder.color}
          onChange={(color) => onUpdateFolder(folder.id, { color })}
          onClose={() => setShowColorPicker(false)}
        />
      )}

      {folder.isOpen && (
        <div>
          {childFolders.map((child) => (
            <FolderRow key={child.id} folder={child} depth={depth + 1} {...sharedChildProps} />
          ))}
          {folderNotes.map((note) => (
            <NoteRow
              key={note.id}
              note={note}
              depth={depth + 1}
              activeNoteId={activeNoteId}
              showGraph={showGraph}
              onSelectNote={onSelectNote}
              onDeleteNote={onDeleteNote}
              onUpdateNote={onUpdateNote}
            />
          ))}
        </div>
      )}
    </div>
  );
}

/** Note row */
function NoteRow({
  note,
  depth,
  activeNoteId,
  showGraph,
  onSelectNote,
  onDeleteNote,
  onUpdateNote,
}: {
  note: Note;
  depth: number;
  activeNoteId: string | null;
  showGraph: boolean;
  onSelectNote: (id: string) => void;
  onDeleteNote: (id: string) => void;
  onUpdateNote: (id: string, updates: Partial<Note>) => void;
}) {
  const [showColorPicker, setShowColorPicker] = useState(false);
  const paletteRef = useRef<HTMLButtonElement>(null);
  const isActive = activeNoteId === note.id && !showGraph;

  return (
    <div
      draggable
      onDragStart={(e) => e.dataTransfer.setData("noteId", note.id)}
      onClick={() => onSelectNote(note.id)}
      style={{ paddingLeft: `${6 + depth * 16}px` }}
      className={clsx(
        "group flex items-center justify-between pr-1 py-1.5 rounded-lg cursor-pointer transition-colors select-none relative",
        isActive
          ? "bg-violet-600/10 font-medium"
          : "text-foreground/70 hover:bg-black/5 dark:hover:bg-white/5 hover:text-foreground"
      )}
    >
      {/* Color accent bar */}
      {note.color && (
        <span
          className="absolute top-1.5 bottom-1.5 w-[3px] rounded-full"
          style={{
            backgroundColor: note.color,
            left: `${3 + depth * 16}px`,
          }}
        />
      )}

      <div className="flex items-center gap-2 truncate">
        <FileText
          size={13}
          className="flex-shrink-0"
          style={{ color: note.color ?? (isActive ? "#8b5cf6" : undefined) }}
        />
        <span
          className="truncate text-sm"
          style={note.color ? { color: note.color } : isActive ? { color: "#7c3aed" } : {}}
        >
          {note.title || "Nota sem título"}
        </span>
      </div>

      <div className="opacity-0 group-hover:opacity-100 flex items-center gap-0.5 flex-shrink-0">
        <button
          ref={paletteRef}
          title="Cor da nota"
          onClick={(e) => { e.stopPropagation(); setShowColorPicker((v) => !v); }}
          className="p-1 rounded text-foreground/30 hover:text-foreground hover:bg-black/10 dark:hover:bg-white/10 transition-all"
        >
          <Palette size={11} />
        </button>
        <button
          onClick={(e) => { e.stopPropagation(); onDeleteNote(note.id); }}
          className="p-1 rounded text-foreground/30 hover:text-red-500 dark:hover:text-red-400 transition-all"
        >
          <Trash2 size={11} />
        </button>
      </div>

      {showColorPicker && (
        <ColorPicker
          triggerRef={paletteRef}
          currentColor={note.color}
          onChange={(color) => onUpdateNote(note.id, { color })}
          onClose={() => setShowColorPicker(false)}
        />
      )}
    </div>
  );
}

export default function Sidebar({
  notes,
  folders,
  activeNoteId,
  onSelectNote,
  onCreateNote,
  onDeleteNote,
  onUpdateNote,
  onMoveNote,
  onCreateFolder,
  onDeleteFolder,
  onRenameFolder,
  onUpdateFolder,
  onToggleFolder,
  showGraph,
  setShowGraph,
  onOpenSettings,
}: SidebarProps) {
  const [search, setSearch] = useState("");
  const [renamingId, setRenamingId] = useState<string | null>(null);
  const [dragOverRoot, setDragOverRoot] = useState(false);
  const [dragOverId, setDragOverId] = useState<string | null>(null);

  const rootFolders = folders.filter((f) => f.parentId === null);
  const rootNotes = notes.filter((n) => n.folderId === null);

  const isSearching = search.trim().length > 0;
  const filteredNotes = isSearching
    ? notes.filter(
        (n) =>
          n.title.toLowerCase().includes(search.toLowerCase()) ||
          n.content.toLowerCase().includes(search.toLowerCase())
      )
    : [];

  const sharedProps = {
    notes, folders, activeNoteId, showGraph, renamingId, dragOverId,
    onSelectNote, onDeleteNote, onUpdateNote, onMoveNote,
    onCreateNote, onCreateFolder, onDeleteFolder, onRenameFolder, onUpdateFolder, onToggleFolder,
    setRenamingId, setDragOverId,
  };

  return (
    <div className="w-72 h-full bg-gray-50 dark:bg-[#121212] border-r border-black/5 dark:border-white/5 flex flex-col">
      {/* Header */}
      <div className="p-4 flex items-center justify-between">
        <div className="flex items-center gap-2 text-foreground font-semibold">
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
              showGraph
                ? "bg-violet-600/20 text-violet-600 dark:text-violet-400"
                : "text-foreground/50 hover:text-foreground hover:bg-black/5 dark:hover:bg-white/5"
            )}
            title="Alternar Visão de Grafo"
          >
            <Network size={16} />
          </button>
          <button
            onClick={() => onCreateFolder(null)}
            className="p-1.5 rounded-md text-foreground/50 hover:text-foreground hover:bg-black/5 dark:hover:bg-white/5 transition-colors"
            title="Nova Pasta"
          >
            <FolderPlus size={16} />
          </button>
          <button
            onClick={() => onCreateNote(null)}
            className="p-1.5 rounded-md text-foreground/50 hover:text-foreground hover:bg-black/5 dark:hover:bg-white/5 transition-colors"
            title="Nova Nota"
          >
            <Plus size={16} />
          </button>
        </div>
      </div>

      {/* Search */}
      <div className="px-4 pb-3">
        <div className="relative">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-foreground/30" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Buscar notas..."
            className="w-full bg-white dark:bg-white/5 border border-black/10 dark:border-white/10 rounded-lg pl-9 pr-4 py-1.5 text-sm text-foreground placeholder:text-foreground/40 outline-none focus:border-violet-500/50 transition-colors shadow-sm dark:shadow-none"
          />
        </div>
      </div>

      {/* Tree */}
      <div className="flex-1 overflow-y-auto px-2 pb-2">
        {isSearching ? (
          <div className="space-y-0.5">
            {filteredNotes.length === 0 ? (
              <div className="text-center py-8 text-foreground/30 text-sm">Nenhuma nota encontrada</div>
            ) : (
              filteredNotes.map((note) => (
                <NoteRow key={note.id} note={note} depth={0}
                  activeNoteId={activeNoteId} showGraph={showGraph}
                  onSelectNote={onSelectNote} onDeleteNote={onDeleteNote} onUpdateNote={onUpdateNote} />
              ))
            )}
          </div>
        ) : (
          <div className="space-y-0.5">
            {rootFolders.map((folder) => (
              <FolderRow key={folder.id} folder={folder} depth={0} {...sharedProps} />
            ))}

            {/* Root drop zone */}
            <div
              onDragOver={(e) => { e.preventDefault(); setDragOverRoot(true); }}
              onDragLeave={() => setDragOverRoot(false)}
              onDrop={(e) => {
                e.preventDefault();
                const noteId = e.dataTransfer.getData("noteId");
                if (noteId) onMoveNote(noteId, null);
                setDragOverRoot(false);
              }}
              className={clsx(
                "rounded-lg transition-colors min-h-[4px]",
                dragOverRoot && rootNotes.length === 0
                  ? "min-h-[40px] bg-violet-500/10 ring-1 ring-violet-400/30"
                  : ""
              )}
            >
              {rootNotes.map((note) => (
                <NoteRow key={note.id} note={note} depth={0}
                  activeNoteId={activeNoteId} showGraph={showGraph}
                  onSelectNote={onSelectNote} onDeleteNote={onDeleteNote} onUpdateNote={onUpdateNote} />
              ))}
            </div>

            {folders.length === 0 && rootNotes.length === 0 && (
              <div className="text-center py-8 text-foreground/30 text-xs px-2 leading-relaxed">
                Nenhuma nota ainda.<br />
                Use <strong>+</strong> para criar uma nota ou <strong>📁</strong> para criar uma pasta.
              </div>
            )}
          </div>
        )}
      </div>

      {/* Footer */}
      <div className="p-3 border-t border-black/5 dark:border-white/5">
        <button
          onClick={onOpenSettings}
          className="w-full flex items-center gap-3 px-3 py-2 rounded-lg text-foreground/50 hover:text-foreground hover:bg-black/5 dark:hover:bg-white/5 transition-colors text-sm"
        >
          <Settings size={16} />
          Configurações
        </button>
      </div>
    </div>
  );
}
