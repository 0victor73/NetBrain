"use client";

import { useEffect, useState } from "react";
import Sidebar from "@/components/Sidebar";
import Editor from "@/components/Editor";
import Graph from "@/components/Graph";
import { Note } from "@/lib/types";

export default function Home() {
  const [notes, setNotes] = useState<Note[]>([]);
  const [activeNoteId, setActiveNoteId] = useState<string | null>(null);
  const [showGraph, setShowGraph] = useState(false);
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    const savedNotes = localStorage.getItem("netbrain-notes");
    if (savedNotes) {
      setNotes(JSON.parse(savedNotes));
    } else {
      const initialNote: Note = {
        id: crypto.randomUUID(),
        title: "Welcome to NetBrain",
        content: "# Welcome to NetBrain!\n\nThis is a minimal web-based knowledge graph inspired by Obsidian.\n\n## Features\n- Write notes in **Markdown**.\n- Link notes together using `[[Note Title]]` syntax.\n- View your knowledge connections in the **Graph View**.\n\nTry creating a new note and link it by typing `[[Welcome to NetBrain]]`.",
        createdAt: Date.now(),
        updatedAt: Date.now(),
      };
      setNotes([initialNote]);
      setActiveNoteId(initialNote.id);
    }
    setIsLoaded(true);
  }, []);

  useEffect(() => {
    if (isLoaded) {
      localStorage.setItem("netbrain-notes", JSON.stringify(notes));
    }
  }, [notes, isLoaded]);

  const handleCreateNote = () => {
    const newNote: Note = {
      id: crypto.randomUUID(),
      title: "",
      content: "",
      createdAt: Date.now(),
      updatedAt: Date.now(),
    };
    setNotes([newNote, ...notes]);
    setActiveNoteId(newNote.id);
    setShowGraph(false);
  };

  const handleUpdateNote = (id: string, updates: Partial<Note>) => {
    setNotes((prev) =>
      prev.map((n) => (n.id === id ? { ...n, ...updates, updatedAt: Date.now() } : n))
    );
  };

  const handleDeleteNote = (id: string) => {
    setNotes((prev) => prev.filter((n) => n.id !== id));
    if (activeNoteId === id) {
      setActiveNoteId(null);
    }
  };

  const handleNodeClick = (node: any) => {
    setActiveNoteId(node.id);
    setShowGraph(false);
  };

  if (!isLoaded) {
    return (
      <div className="flex items-center justify-center h-screen bg-[#0a0a0a] text-white">
        Loading...
      </div>
    );
  }

  const activeNote = notes.find((n) => n.id === activeNoteId) || null;

  return (
    <div className="flex h-screen w-full bg-[#0a0a0a] text-white overflow-hidden">
      <Sidebar
        notes={notes}
        activeNoteId={activeNoteId}
        onSelectNote={(id) => {
          setActiveNoteId(id);
          setShowGraph(false);
        }}
        onCreateNote={handleCreateNote}
        onDeleteNote={handleDeleteNote}
        showGraph={showGraph}
        setShowGraph={setShowGraph}
      />
      
      <main className="flex-1 flex flex-col relative h-full">
        {showGraph ? (
          <Graph notes={notes} onNodeClick={handleNodeClick} />
        ) : (
          <Editor note={activeNote} updateNote={handleUpdateNote} />
        )}
      </main>
    </div>
  );
}
