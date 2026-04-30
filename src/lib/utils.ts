import { Note } from "./types";

export const extractLinks = (content: string): string[] => {
  const regex = /\[\[(.*?)\]\]/g;
  const links: string[] = [];
  let match;
  while ((match = regex.exec(content)) !== null) {
    links.push(match[1]);
  }
  return links;
};

export const generateGraphData = (notes: Note[]) => {
  const nodes = notes.map((note) => ({ id: note.id, name: note.title, val: 5, color: note.color }));
  const links: { source: string; target: string }[] = [];

  notes.forEach((note) => {
    const extractedTitles = extractLinks(note.content);
    extractedTitles.forEach((title) => {
      const targetNote = notes.find((n) => n.title.toLowerCase() === title.toLowerCase());
      if (targetNote) {
        links.push({ source: note.id, target: targetNote.id });
        
        // Aumenta o peso dos nós conectados
        const sNode = nodes.find(n => n.id === note.id);
        const tNode = nodes.find(n => n.id === targetNote.id);
        if (sNode) sNode.val += 2;
        if (tNode) tNode.val += 2;
      }
    });
  });

  return { nodes, links };
};
