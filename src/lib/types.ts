export type Note = {
  id: string;
  title: string;
  content: string;
  folderId: string | null; // null = raiz
  color: string | null;    // null = cor padrão
  createdAt: number;
  updatedAt: number;
  netId?: string;      // Which net this note belongs to
  createdBy?: string;  // UID of the user who created this note
  order?: number;
  x?: number;
  y?: number;
};

export type Folder = {
  id: string;
  name: string;
  parentId: string | null; // null = raiz (suporte a sub-pastas)
  isOpen: boolean;
  color: string | null;    // null = cor padrão
  createdAt: number;
  order?: number;
};

export type Theme = "system" | "light" | "dark";
export type EditorMode = "edit" | "preview" | "split";
export type EditorFont = "mono" | "sans" | "serif";
export type FontSize = "sm" | "base" | "lg";

export type Settings = {
  theme: Theme;
  defaultEditorMode: EditorMode;
  editorFont: EditorFont;
  fontSize: FontSize;
  spellCheck: boolean;
  lineNumbers: boolean;
};

export const DEFAULT_SETTINGS: Settings = {
  theme: "system",
  defaultEditorMode: "split",
  editorFont: "mono",
  fontSize: "sm",
  spellCheck: false,
  lineNumbers: false,
};

export const COLOR_SWATCHES: { label: string; value: string | null }[] = [
  { label: "Padrão", value: null },
  { label: "Vermelho", value: "#ef4444" },
  { label: "Laranja", value: "#f97316" },
  { label: "Amarelo", value: "#eab308" },
  { label: "Verde", value: "#22c55e" },
  { label: "Ciano", value: "#14b8a6" },
  { label: "Azul", value: "#3b82f6" },
  { label: "Roxo", value: "#8b5cf6" },
  { label: "Rosa", value: "#ec4899" },
];
