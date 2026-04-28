"use client";

import { useEffect, useState } from "react";
import Sidebar from "@/components/Sidebar";
import Editor from "@/components/Editor";
import Graph from "@/components/Graph";
import SettingsPanel from "@/components/SettingsPanel";
import { useSettings } from "@/lib/useSettings";
import { Note, Folder } from "@/lib/types";

export default function Home() {
  const [notes, setNotes] = useState<Note[]>([]);
  const [folders, setFolders] = useState<Folder[]>([]);
  const [activeNoteId, setActiveNoteId] = useState<string | null>(null);
  const [showGraph, setShowGraph] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [isLoaded, setIsLoaded] = useState(false);

  const { settings, updateSettings, isLoaded: settingsLoaded } = useSettings();

  // Load persisted data — migrate old notes that lack folderId/color fields
  useEffect(() => {
    const savedFolders = localStorage.getItem("netbrain-folders");
    const savedNotes = localStorage.getItem("netbrain-notes");

    if (savedFolders) {
      const parsed: Folder[] = JSON.parse(savedFolders);
      // Migrate: ensure every folder has color field
      setFolders(parsed.map((f) => ({ ...f, color: f.color ?? null })));
    }

    if (savedNotes) {
      const parsed: Note[] = JSON.parse(savedNotes);
      // Migrate: folderId undefined → null, and add color if missing
      setNotes(
        parsed.map((n) => ({
          ...n,
          folderId: n.folderId ?? null,
          color: n.color ?? null,
        }))
      );
    } else {
      const initialNote: Note = {
        id: crypto.randomUUID(),
        title: "Bem-vindo ao NetBrain",
        content:
          "# Bem-vindo ao NetBrain!\n\nEste é um mapa mental mínimo baseado na web, inspirado no Obsidian.\n\n## Funcionalidades\n- Escreva notas em **Markdown**.\n- Conecte notas usando a sintaxe `[[Título da Nota]]`.\n- Visualize suas conexões de conhecimento na **Visão de Grafo**.\n- Organize notas em **pastas** (arraste e solte para mover).\n- Mude a cor de notas e pastas clicando em 🎨.\n\nExperimente criar uma pasta clicando no ícone 📁 na barra lateral!",
        folderId: null,
        color: null,
        createdAt: Date.now(),
        updatedAt: Date.now(),
      };
      setNotes([initialNote]);
      setActiveNoteId(initialNote.id);
    }
    setIsLoaded(true);
  }, []);

  useEffect(() => {
    if (isLoaded) localStorage.setItem("netbrain-notes", JSON.stringify(notes));
  }, [notes, isLoaded]);

  useEffect(() => {
    if (isLoaded) localStorage.setItem("netbrain-folders", JSON.stringify(folders));
  }, [folders, isLoaded]);

  // ── Note handlers ──────────────────────────────────────────────────────────
  const handleCreateNote = (folderId: string | null = null) => {
    const newNote: Note = {
      id: crypto.randomUUID(),
      title: "",
      content: "",
      folderId,
      color: null,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    };
    setNotes((prev) => [newNote, ...prev]);
    setActiveNoteId(newNote.id);
    setShowGraph(false);
    if (folderId) {
      setFolders((prev) =>
        prev.map((f) => (f.id === folderId ? { ...f, isOpen: true } : f))
      );
    }
  };

  const handleUpdateNote = (id: string, updates: Partial<Note>) => {
    setNotes((prev) =>
      prev.map((n) => (n.id === id ? { ...n, ...updates, updatedAt: Date.now() } : n))
    );
  };

  const handleDeleteNote = (id: string) => {
    setNotes((prev) => prev.filter((n) => n.id !== id));
    if (activeNoteId === id) setActiveNoteId(null);
  };

  const handleMoveNote = (noteId: string, folderId: string | null) => {
    setNotes((prev) => prev.map((n) => (n.id === noteId ? { ...n, folderId } : n)));
  };

  // ── Folder handlers ────────────────────────────────────────────────────────
  const handleCreateFolder = (parentId: string | null = null) => {
    const newFolder: Folder = {
      id: crypto.randomUUID(),
      name: "Nova Pasta",
      parentId,
      isOpen: true,
      color: null,
      createdAt: Date.now(),
    };
    setFolders((prev) => [...prev, newFolder]);
    // Open parent so new sub-folder is visible
    if (parentId) {
      setFolders((prev) =>
        prev.map((f) => (f.id === parentId ? { ...f, isOpen: true } : f))
      );
    }
  };

  const handleDeleteFolder = (id: string) => {
    const folder = folders.find((f) => f.id === id);
    const targetFolderId = folder?.parentId ?? null;

    // Move notes in deleted folder up to the parent
    setNotes((prev) =>
      prev.map((n) => (n.folderId === id ? { ...n, folderId: targetFolderId } : n))
    );

    // Delete all descendant folders recursively
    const getAllDescendantIds = (folderId: string): string[] => {
      const children = folders.filter((f) => f.parentId === folderId);
      return [folderId, ...children.flatMap((c) => getAllDescendantIds(c.id))];
    };
    const toDelete = getAllDescendantIds(id);
    setFolders((prev) => prev.filter((f) => !toDelete.includes(f.id)));
  };

  const handleRenameFolder = (id: string, name: string) => {
    setFolders((prev) => prev.map((f) => (f.id === id ? { ...f, name } : f)));
  };

  const handleUpdateFolder = (id: string, updates: Partial<Folder>) => {
    setFolders((prev) => prev.map((f) => (f.id === id ? { ...f, ...updates } : f)));
  };

  const handleToggleFolder = (id: string) => {
    setFolders((prev) =>
      prev.map((f) => (f.id === id ? { ...f, isOpen: !f.isOpen } : f))
    );
  };

  const handleNodeClick = (node: any) => {
    setActiveNoteId(node.id);
    setShowGraph(false);
  };

  if (!isLoaded || !settingsLoaded) {
    return (
      <div className="flex items-center justify-center h-screen bg-background text-foreground">
        Carregando...
      </div>
    );
  }

  const activeNote = notes.find((n) => n.id === activeNoteId) || null;

  return (
    <div className="flex h-screen w-full bg-background text-foreground overflow-hidden">
      <Sidebar
        notes={notes}
        folders={folders}
        activeNoteId={activeNoteId}
        onSelectNote={(id) => { setActiveNoteId(id); setShowGraph(false); }}
        onCreateNote={handleCreateNote}
        onDeleteNote={handleDeleteNote}
        onUpdateNote={handleUpdateNote}
        onMoveNote={handleMoveNote}
        onCreateFolder={handleCreateFolder}
        onDeleteFolder={handleDeleteFolder}
        onRenameFolder={handleRenameFolder}
        onUpdateFolder={handleUpdateFolder}
        onToggleFolder={handleToggleFolder}
        showGraph={showGraph}
        setShowGraph={setShowGraph}
        onOpenSettings={() => setShowSettings(true)}
      />

      <main className="flex-1 flex flex-col relative h-full">
        {showGraph ? (
          <Graph notes={notes} onNodeClick={handleNodeClick} settings={settings} />
        ) : (
          <Editor note={activeNote} updateNote={handleUpdateNote} settings={settings} />
        )}
      </main>

      {showSettings && (
        <SettingsPanel
          settings={settings}
          updateSettings={updateSettings}
          onClose={() => setShowSettings(false)}
        />
      )}
    </div>
  );
}
