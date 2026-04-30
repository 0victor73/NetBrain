"use client";

import { useEffect, useState } from "react";
import Sidebar from "@/components/Sidebar";
import Editor from "@/components/Editor";
import Graph from "@/components/Graph";
import SettingsPanel from "@/components/SettingsPanel";
import { useSettings } from "@/lib/useSettings";
import { Note, Folder } from "@/lib/types";
import { useAuth } from "@/lib/auth-context";
import clsx from "clsx";

import { useParams } from "next/navigation";
import { 
  getNetFolders, 
  getNetNotes, 
  saveNote, 
  saveFolder, 
  updateNoteDB, 
  updateFolderDB, 
  deleteNoteDB, 
  batchDeleteFolderAndContents 
} from "@/lib/db";

export default function Home() {
  const { id: netId } = useParams() as { id: string };
  const [notes, setNotes] = useState<Note[]>([]);
  const [folders, setFolders] = useState<Folder[]>([]);
  const [activeNoteId, setActiveNoteId] = useState<string | null>(null);
  const [showGraph, setShowGraph] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [isLoaded, setIsLoaded] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const { settings, updateSettings, isLoaded: settingsLoaded } = useSettings();
  const { user, loading } = useAuth();

  useEffect(() => {
    if (loading) return;
    if (!user) return; 

    const loadData = async () => {
      try {
        const fetchedFolders = await getNetFolders(netId);
        const fetchedNotes = await getNetNotes(netId);
        
        setFolders(fetchedFolders);
        
        if (fetchedNotes.length > 0) {
          setNotes(fetchedNotes);
          setActiveNoteId(fetchedNotes[0].id);
        } else {
          // If no notes exist in this Net, we can optionally create a welcome note.
          // For now, just set empty array. User can create one.
        }
      } catch (error) {
        console.error("Erro ao carregar dados:", error);
      } finally {
        setIsLoaded(true);
      }
    };
    
    loadData();
  }, [user, loading, netId]);
  // ── Note handlers ──────────────────────────────────────────────────────────
  const handleCreateNote = async (folderId: string | null = null) => {
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
    
    // Save to Firestore
    await saveNote(netId, newNote);

    if (folderId) {
      setFolders((prev) =>
        prev.map((f) => (f.id === folderId ? { ...f, isOpen: true } : f))
      );
      // Optional: Update folder isOpen state in DB if you want it persisted
      await updateFolderDB(folderId, { isOpen: true });
    }
  };

  const handleUpdateNote = async (id: string, updates: Partial<Note>) => {
    setNotes((prev) =>
      prev.map((n) => (n.id === id ? { ...n, ...updates, updatedAt: Date.now() } : n))
    );
    await updateNoteDB(id, { ...updates, updatedAt: Date.now() });
  };

  const handleDeleteNote = async (id: string) => {
    setNotes((prev) => prev.filter((n) => n.id !== id));
    if (activeNoteId === id) setActiveNoteId(null);
    await deleteNoteDB(id);
  };

  const handleMoveNote = async (noteId: string, folderId: string | null) => {
    setNotes((prev) => prev.map((n) => (n.id === noteId ? { ...n, folderId } : n)));
    await updateNoteDB(noteId, { folderId });
  };

  // ── Folder handlers ────────────────────────────────────────────────────────
  const handleCreateFolder = async (parentId: string | null = null) => {
    const newFolder: Folder = {
      id: crypto.randomUUID(),
      name: "Nova Pasta",
      parentId,
      isOpen: true,
      color: null,
      createdAt: Date.now(),
    };
    setFolders((prev) => [...prev, newFolder]);
    await saveFolder(netId, newFolder);

    if (parentId) {
      setFolders((prev) =>
        prev.map((f) => (f.id === parentId ? { ...f, isOpen: true } : f))
      );
      await updateFolderDB(parentId, { isOpen: true });
    }
  };

  const handleDeleteFolder = async (id: string) => {
    // Optimistic UI update
    const folder = folders.find((f) => f.id === id);
    const targetFolderId = folder?.parentId ?? null;

    setNotes((prev) =>
      prev.map((n) => (n.folderId === id ? { ...n, folderId: targetFolderId } : n))
    );

    const getAllDescendantIds = (folderId: string): string[] => {
      const children = folders.filter((f) => f.parentId === folderId);
      return [folderId, ...children.flatMap((c) => getAllDescendantIds(c.id))];
    };
    const toDelete = getAllDescendantIds(id);
    setFolders((prev) => prev.filter((f) => !toDelete.includes(f.id)));

    // Perform batch deletion in Firestore
    await batchDeleteFolderAndContents(id, folders, notes);
  };

  const handleRenameFolder = async (id: string, name: string) => {
    setFolders((prev) => prev.map((f) => (f.id === id ? { ...f, name } : f)));
    await updateFolderDB(id, { name });
  };

  const handleUpdateFolder = async (id: string, updates: Partial<Folder>) => {
    setFolders((prev) => prev.map((f) => (f.id === id ? { ...f, ...updates } : f)));
    await updateFolderDB(id, updates);
  };

  const handleToggleFolder = async (id: string) => {
    const folder = folders.find((f) => f.id === id);
    if (!folder) return;
    
    const newIsOpen = !folder.isOpen;
    setFolders((prev) =>
      prev.map((f) => (f.id === id ? { ...f, isOpen: newIsOpen } : f))
    );
    await updateFolderDB(id, { isOpen: newIsOpen });
  };

  const handleNodeClick = (node: any) => {
    setActiveNoteId(node.id);
    setShowGraph(false);
    setIsMobileMenuOpen(false);
  };

  if (loading || !isLoaded || !settingsLoaded) {
    return (
      <div className="flex items-center justify-center h-screen bg-background text-foreground">
        Carregando...
      </div>
    );
  }

  if (!user) return null;

  const activeNote = notes.find((n) => n.id === activeNoteId) || null;

  return (
    <div className="flex h-screen w-full bg-background text-foreground overflow-hidden">
      
      {/* Mobile Overlay */}
      {isMobileMenuOpen && (
        <div 
          className="fixed inset-0 bg-black/50 z-40 md:hidden backdrop-blur-sm"
          onClick={() => setIsMobileMenuOpen(false)}
        />
      )}

      {/* Sidebar Wrapper for responsiveness */}
      <div className={clsx(
        "fixed inset-y-0 left-0 z-50 w-72 h-full transition-transform duration-300 md:relative md:translate-x-0 bg-background border-r border-border",
        isMobileMenuOpen ? "translate-x-0" : "-translate-x-full"
      )}>
        <Sidebar
          notes={notes}
          folders={folders}
          activeNoteId={activeNoteId}
          onSelectNote={(id) => { setActiveNoteId(id); setShowGraph(false); setIsMobileMenuOpen(false); }}
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
          setShowGraph={(val) => { setShowGraph(val); setIsMobileMenuOpen(false); }}
          onOpenSettings={() => { setShowSettings(true); setIsMobileMenuOpen(false); }}
        />
      </div>

      <main className="flex-1 flex flex-col relative h-full w-full overflow-hidden">
        {showGraph ? (
          <Graph 
            notes={notes} 
            onNodeClick={handleNodeClick} 
            settings={settings} 
            onToggleMenu={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
          />
        ) : (
          <Editor 
            note={activeNote} 
            notes={notes}
            updateNote={handleUpdateNote} 
            onSelectNote={(id) => { setActiveNoteId(id); setShowGraph(false); }}
            settings={settings} 
            onToggleMenu={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
          />
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
