"use client";

import { useState, useCallback, useEffect, useRef } from "react";
import type { NoteFlowData, Notebook, Note, AppState, SidebarView } from "@/lib/types";
import { loadData, saveData, generateId, getPlainText, purgeOldTrash } from "@/lib/storage";

const initialAppState: AppState = {
  sidebarView: "all",
  selectedNotebookId: null,
  selectedTagFilter: null,
  selectedNoteId: null,
  searchQuery: "",
  mobilePanel: "sidebar",
};

export function useNoteFlow() {
  const [data, setData] = useState<NoteFlowData | null>(null);
  const [appState, setAppState] = useState<AppState>(initialAppState);
  const saveTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Load data on mount
  useEffect(() => {
    const loaded = purgeOldTrash(loadData());
    setData(loaded);
    // Auto-select first note if available
    const activeNotes = loaded.notes.filter((n) => !n.isDeleted);
    if (activeNotes.length > 0) {
      setAppState((s) => ({ ...s, selectedNoteId: activeNotes[0].id }));
    }
  }, []);

  // Auto-save with debounce
  const persistData = useCallback((newData: NoteFlowData) => {
    setData(newData);
    if (saveTimeoutRef.current) clearTimeout(saveTimeoutRef.current);
    saveTimeoutRef.current = setTimeout(() => saveData(newData), 300);
  }, []);

  // Theme
  const setTheme = useCallback(
    (theme: "dark" | "light" | "system") => {
      if (!data) return;
      persistData({ ...data, settings: { ...data.settings, theme } });
    },
    [data, persistData]
  );

  // Notebooks
  const createNotebook = useCallback(
    (name?: string) => {
      if (!data) return;
      const nb: Notebook = {
        id: generateId(),
        name: name || "Untitled Notebook",
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        sortOrder: data.notebooks.length,
      };
      persistData({ ...data, notebooks: [...data.notebooks, nb] });
      setAppState((s) => ({
        ...s,
        sidebarView: "notebook",
        selectedNotebookId: nb.id,
        mobilePanel: "list",
      }));
      return nb;
    },
    [data, persistData]
  );

  const renameNotebook = useCallback(
    (id: string, name: string) => {
      if (!data) return;
      persistData({
        ...data,
        notebooks: data.notebooks.map((nb) =>
          nb.id === id ? { ...nb, name, updatedAt: new Date().toISOString() } : nb
        ),
      });
    },
    [data, persistData]
  );

  const deleteNotebook = useCallback(
    (id: string) => {
      if (!data) return;
      const now = new Date().toISOString();
      persistData({
        ...data,
        notebooks: data.notebooks.filter((nb) => nb.id !== id),
        notes: data.notes.map((n) =>
          n.notebookId === id ? { ...n, isDeleted: true, deletedAt: now } : n
        ),
      });
      setAppState((s) => ({
        ...s,
        sidebarView: "all",
        selectedNotebookId: null,
        selectedNoteId: null,
      }));
    },
    [data, persistData]
  );

  // Notes
  const createNote = useCallback(
    (notebookId?: string) => {
      if (!data) return;
      const targetNotebookId =
        notebookId || appState.selectedNotebookId || data.notebooks[0]?.id;
      if (!targetNotebookId) {
        // Create a default notebook first
        const nb: Notebook = {
          id: generateId(),
          name: "My Notebook",
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          sortOrder: 0,
        };
        const note: Note = {
          id: generateId(),
          notebookId: nb.id,
          title: "",
          content: "",
          plainText: "",
          tags: [],
          isPinned: false,
          isDeleted: false,
          deletedAt: null,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          sortOrder: 0,
        };
        persistData({
          ...data,
          notebooks: [...data.notebooks, nb],
          notes: [note, ...data.notes],
        });
        setAppState((s) => ({
          ...s,
          selectedNoteId: note.id,
          selectedNotebookId: nb.id,
          sidebarView: "notebook",
          mobilePanel: "editor",
        }));
        return note;
      }
      const note: Note = {
        id: generateId(),
        notebookId: targetNotebookId,
        title: "",
        content: "",
        plainText: "",
        tags: [],
        isPinned: false,
        isDeleted: false,
        deletedAt: null,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        sortOrder: 0,
      };
      persistData({ ...data, notes: [note, ...data.notes] });
      setAppState((s) => ({
        ...s,
        selectedNoteId: note.id,
        mobilePanel: "editor",
      }));
      return note;
    },
    [data, appState.selectedNotebookId, persistData]
  );

  const updateNote = useCallback(
    (id: string, updates: Partial<Pick<Note, "title" | "content" | "tags" | "isPinned">>) => {
      if (!data) return;
      persistData({
        ...data,
        notes: data.notes.map((n) => {
          if (n.id !== id) return n;
          const plainText = updates.content !== undefined ? getPlainText(updates.content) : n.plainText;
          return { ...n, ...updates, plainText, updatedAt: new Date().toISOString() };
        }),
      });
    },
    [data, persistData]
  );

  const deleteNote = useCallback(
    (id: string) => {
      if (!data) return;
      persistData({
        ...data,
        notes: data.notes.map((n) =>
          n.id === id
            ? { ...n, isDeleted: true, deletedAt: new Date().toISOString() }
            : n
        ),
      });
      // Select next note
      const remaining = data.notes.filter((n) => n.id !== id && !n.isDeleted);
      setAppState((s) => ({
        ...s,
        selectedNoteId: remaining[0]?.id || null,
      }));
    },
    [data, persistData]
  );

  const restoreNote = useCallback(
    (id: string) => {
      if (!data) return;
      const note = data.notes.find((n) => n.id === id);
      if (!note) return;
      // Restore notebook if it was deleted
      const notebookExists = data.notebooks.some((nb) => nb.id === note.notebookId);
      let notebooks = data.notebooks;
      if (!notebookExists) {
        notebooks = [
          ...notebooks,
          {
            id: note.notebookId,
            name: "Restored Notebook",
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
            sortOrder: notebooks.length,
          },
        ];
      }
      persistData({
        ...data,
        notebooks,
        notes: data.notes.map((n) =>
          n.id === id ? { ...n, isDeleted: false, deletedAt: null } : n
        ),
      });
    },
    [data, persistData]
  );

  const permanentlyDeleteNote = useCallback(
    (id: string) => {
      if (!data) return;
      persistData({
        ...data,
        notes: data.notes.filter((n) => n.id !== id),
      });
      setAppState((s) => ({
        ...s,
        selectedNoteId: s.selectedNoteId === id ? null : s.selectedNoteId,
      }));
    },
    [data, persistData]
  );

  const emptyTrash = useCallback(() => {
    if (!data) return;
    persistData({
      ...data,
      notes: data.notes.filter((n) => !n.isDeleted),
    });
    setAppState((s) => ({ ...s, selectedNoteId: null }));
  }, [data, persistData]);

  // Tags
  const addTag = useCallback(
    (noteId: string, tag: string) => {
      if (!data) return;
      const trimmed = tag.trim().toLowerCase();
      if (!trimmed) return;
      persistData({
        ...data,
        notes: data.notes.map((n) =>
          n.id === noteId && !n.tags.includes(trimmed)
            ? { ...n, tags: [...n.tags, trimmed], updatedAt: new Date().toISOString() }
            : n
        ),
      });
    },
    [data, persistData]
  );

  const removeTag = useCallback(
    (noteId: string, tag: string) => {
      if (!data) return;
      persistData({
        ...data,
        notes: data.notes.map((n) =>
          n.id === noteId
            ? { ...n, tags: n.tags.filter((t) => t !== tag), updatedAt: new Date().toISOString() }
            : n
        ),
      });
    },
    [data, persistData]
  );

  // Derived state
  const allTags = data
    ? Array.from(
        data.notes
          .filter((n) => !n.isDeleted)
          .reduce((map, n) => {
            n.tags.forEach((t) => map.set(t, (map.get(t) || 0) + 1));
            return map;
          }, new Map<string, number>())
      )
        .map(([tag, count]) => ({ tag, count }))
        .sort((a, b) => b.count - a.count)
    : [];

  const filteredNotes = data
    ? data.notes
        .filter((n) => {
          if (appState.sidebarView === "trash") return n.isDeleted;
          if (n.isDeleted) return false;
          if (appState.sidebarView === "notebook" && appState.selectedNotebookId)
            return n.notebookId === appState.selectedNotebookId;
          if (appState.sidebarView === "tag" && appState.selectedTagFilter)
            return n.tags.includes(appState.selectedTagFilter);
          return true; // "all" view
        })
        .filter((n) => {
          if (!appState.searchQuery) return true;
          const q = appState.searchQuery.toLowerCase();
          return (
            n.title.toLowerCase().includes(q) || n.plainText.toLowerCase().includes(q)
          );
        })
        .sort((a, b) => {
          // Pinned first (not in trash)
          if (appState.sidebarView !== "trash") {
            if (a.isPinned && !b.isPinned) return -1;
            if (!a.isPinned && b.isPinned) return 1;
          }
          // Then by updatedAt
          return new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime();
        })
    : [];

  const selectedNote = data
    ? data.notes.find((n) => n.id === appState.selectedNoteId) || null
    : null;

  const notebookNoteCount = (notebookId: string) =>
    data ? data.notes.filter((n) => n.notebookId === notebookId && !n.isDeleted).length : 0;

  const trashCount = data ? data.notes.filter((n) => n.isDeleted).length : 0;

  const selectView = useCallback(
    (view: SidebarView, id?: string) => {
      setAppState((s) => ({
        ...s,
        sidebarView: view,
        selectedNotebookId: view === "notebook" ? (id || null) : s.selectedNotebookId,
        selectedTagFilter: view === "tag" ? (id || null) : s.selectedTagFilter,
        selectedNoteId: null,
        mobilePanel: "list",
      }));
    },
    []
  );

  const selectNote = useCallback((noteId: string) => {
    setAppState((s) => ({ ...s, selectedNoteId: noteId, mobilePanel: "editor" }));
  }, []);

  const setSearchQuery = useCallback((query: string) => {
    setAppState((s) => ({ ...s, searchQuery: query }));
  }, []);

  const setMobilePanel = useCallback((panel: "sidebar" | "list" | "editor") => {
    setAppState((s) => ({ ...s, mobilePanel: panel }));
  }, []);

  return {
    data,
    appState,
    // Theme
    setTheme,
    // Notebooks
    createNotebook,
    renameNotebook,
    deleteNotebook,
    // Notes
    createNote,
    updateNote,
    deleteNote,
    restoreNote,
    permanentlyDeleteNote,
    emptyTrash,
    // Tags
    addTag,
    removeTag,
    allTags,
    // Derived
    filteredNotes,
    selectedNote,
    notebookNoteCount,
    trashCount,
    // Navigation
    selectView,
    selectNote,
    setSearchQuery,
    setMobilePanel,
  };
}
