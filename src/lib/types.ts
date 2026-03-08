// NoteFlow Data Types

export interface Notebook {
  id: string;
  name: string;
  createdAt: string;
  updatedAt: string;
  sortOrder: number;
}

export interface Note {
  id: string;
  notebookId: string;
  title: string;
  content: string;
  plainText: string;
  tags: string[];
  isPinned: boolean;
  isDeleted: boolean;
  deletedAt: string | null;
  createdAt: string;
  updatedAt: string;
  sortOrder: number;
}

export interface NoteFlowSettings {
  theme: "dark" | "light" | "system";
  isFirstLaunch: boolean;
}

export interface NoteFlowData {
  settings: NoteFlowSettings;
  notebooks: Notebook[];
  notes: Note[];
}

export type SidebarView = "all" | "notebook" | "tag" | "trash";

export interface AppState {
  sidebarView: SidebarView;
  selectedNotebookId: string | null;
  selectedTagFilter: string | null;
  selectedNoteId: string | null;
  searchQuery: string;
  mobilePanel: "sidebar" | "list" | "editor";
}
