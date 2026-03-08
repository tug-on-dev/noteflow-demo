"use client";

import { useRef, useEffect, useCallback } from "react";
import { useNoteFlow } from "@/hooks/useNoteFlow";
import Header from "@/components/noteflow/Header";
import Sidebar from "@/components/noteflow/Sidebar";
import NotesList from "@/components/noteflow/NotesList";
import NoteEditor from "@/components/noteflow/NoteEditor";
import { exportAsMarkdown, exportAsText } from "@/lib/export";
import { ArrowLeft } from "lucide-react";

export default function Home() {
  const {
    data,
    appState,
    setTheme,
    createNotebook,
    renameNotebook,
    deleteNotebook,
    createNote,
    updateNote,
    deleteNote,
    restoreNote,
    permanentlyDeleteNote,
    emptyTrash,
    addTag,
    removeTag,
    allTags,
    filteredNotes,
    selectedNote,
    notebookNoteCount,
    trashCount,
    selectView,
    selectNote,
    setSearchQuery,
    setMobilePanel,
  } = useNoteFlow();

  const searchInputRef = useRef<HTMLInputElement>(null);

  // Apply theme class to html element
  useEffect(() => {
    if (!data) return;
    const root = document.documentElement;
    root.classList.remove("dark", "light");
    if (data.settings.theme === "system") {
      const prefersDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
      if (prefersDark) root.classList.add("dark");
    } else if (data.settings.theme === "dark") {
      root.classList.add("dark");
    }
  }, [data?.settings.theme]);

  // Listen for system theme changes
  useEffect(() => {
    if (!data || data.settings.theme !== "system") return;
    const mql = window.matchMedia("(prefers-color-scheme: dark)");
    const handler = (e: MediaQueryListEvent) => {
      document.documentElement.classList.toggle("dark", e.matches);
    };
    mql.addEventListener("change", handler);
    return () => mql.removeEventListener("change", handler);
  }, [data?.settings.theme]);

  // Keyboard shortcuts
  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      const isMeta = e.metaKey || e.ctrlKey;

      if (isMeta && e.key === "n" && !e.shiftKey) {
        e.preventDefault();
        createNote();
      } else if (isMeta && e.key === "N" && e.shiftKey) {
        e.preventDefault();
        createNotebook();
      } else if (isMeta && e.key === "f") {
        e.preventDefault();
        searchInputRef.current?.focus();
      } else if (e.key === "Escape") {
        if (appState.searchQuery) {
          setSearchQuery("");
          searchInputRef.current?.blur();
        }
      } else if (e.key === "Delete" && selectedNote && !selectedNote.isDeleted) {
        const active = document.activeElement;
        const isEditing =
          active?.tagName === "INPUT" ||
          active?.tagName === "TEXTAREA" ||
          active?.getAttribute("contenteditable") === "true";
        if (!isEditing) {
          e.preventDefault();
          deleteNote(selectedNote.id);
        }
      }
    },
    [createNote, createNotebook, setSearchQuery, appState.searchQuery, selectedNote, deleteNote]
  );

  useEffect(() => {
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [handleKeyDown]);

  if (!data) {
    return (
      <div className="h-screen flex items-center justify-center bg-background text-foreground">
        <div className="animate-pulse text-lg">Loading NoteFlow...</div>
      </div>
    );
  }

  return (
    <div className="h-screen flex flex-col bg-background text-foreground overflow-hidden" data-testid="noteflow-app">
      <Header
        searchQuery={appState.searchQuery}
        onSearchChange={setSearchQuery}
        theme={data.settings.theme}
        onThemeChange={setTheme}
        searchInputRef={searchInputRef}
      />

      <div className="flex flex-1 overflow-hidden">
        {/* Sidebar - hidden on mobile unless active */}
        <div
          className={`${
            appState.mobilePanel === "sidebar" ? "flex" : "hidden"
          } md:flex flex-shrink-0`}
        >
          <Sidebar
            notebooks={data.notebooks}
            allTags={allTags}
            trashCount={trashCount}
            appState={appState}
            notebookNoteCount={notebookNoteCount}
            onSelectView={selectView}
            onCreateNotebook={createNotebook}
            onRenameNotebook={renameNotebook}
            onDeleteNotebook={deleteNotebook}
          />
        </div>

        {/* Notes List - hidden on mobile unless active */}
        <div
          className={`${
            appState.mobilePanel === "list" ? "flex" : "hidden"
          } md:flex flex-shrink-0 border-r border-border`}
        >
          <div className="flex flex-col">
            {/* Mobile back button */}
            <button
              className="md:hidden flex items-center gap-1 px-3 py-2 text-sm text-muted-foreground hover:text-foreground"
              onClick={() => setMobilePanel("sidebar")}
              aria-label="Back to sidebar"
            >
              <ArrowLeft className="h-4 w-4" />
              Back
            </button>
            <NotesList
              notes={filteredNotes}
              selectedNoteId={appState.selectedNoteId}
              searchQuery={appState.searchQuery}
              sidebarView={appState.sidebarView}
              onSelectNote={selectNote}
              onCreateNote={() => createNote()}
              onDeleteNote={deleteNote}
              onTogglePin={(id, isPinned) => updateNote(id, { isPinned: !isPinned })}
              onRestoreNote={restoreNote}
              onPermanentlyDelete={permanentlyDeleteNote}
              onEmptyTrash={emptyTrash}
            />
          </div>
        </div>

        {/* Editor - hidden on mobile unless active */}
        <div
          className={`${
            appState.mobilePanel === "editor" ? "flex" : "hidden"
          } md:flex flex-1 flex-col min-w-0 overflow-hidden`}
        >
          {/* Mobile back button */}
          <button
            className="md:hidden flex items-center gap-1 px-3 py-2 text-sm text-muted-foreground hover:text-foreground border-b border-border"
            onClick={() => setMobilePanel("list")}
            aria-label="Back to notes list"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to notes
          </button>
          <NoteEditor
            note={selectedNote}
            onUpdateNote={updateNote}
            onAddTag={addTag}
            onRemoveTag={removeTag}
            onDeleteNote={deleteNote}
            onExportMarkdown={exportAsMarkdown}
            onExportText={exportAsText}
            allExistingTags={allTags.map((t) => t.tag)}
          />
        </div>
      </div>
    </div>
  );
}
