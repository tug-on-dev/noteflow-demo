"use client";

import React, { useState, useRef, useEffect, useCallback } from "react";
import {
  BookOpen,
  Plus,
  Tag,
  Trash2,
  MoreHorizontal,
  Pencil,
  ChevronDown,
  FileText,
} from "lucide-react";
import type { Notebook, SidebarView, AppState } from "@/lib/types";

interface SidebarProps {
  notebooks: Notebook[];
  allTags: { tag: string; count: number }[];
  trashCount: number;
  appState: AppState;
  notebookNoteCount: (id: string) => number;
  onSelectView: (view: SidebarView, id?: string) => void;
  onCreateNotebook: () => Notebook | undefined;
  onRenameNotebook: (id: string, name: string) => void;
  onDeleteNotebook: (id: string) => void;
}

export default function Sidebar({
  notebooks,
  allTags,
  trashCount,
  appState,
  notebookNoteCount,
  onSelectView,
  onCreateNotebook,
  onRenameNotebook,
  onDeleteNotebook,
}: SidebarProps) {
  const [contextMenu, setContextMenu] = useState<{
    notebookId: string;
    x: number;
    y: number;
  } | null>(null);
  const [renamingId, setRenamingId] = useState<string | null>(null);
  const [renameValue, setRenameValue] = useState("");
  const [notebooksExpanded, setNotebooksExpanded] = useState(true);
  const [tagsExpanded, setTagsExpanded] = useState(true);

  const renameInputRef = useRef<HTMLInputElement>(null);
  const contextMenuRef = useRef<HTMLDivElement>(null);

  // Focus rename input when entering rename mode
  useEffect(() => {
    if (renamingId && renameInputRef.current) {
      renameInputRef.current.focus();
      renameInputRef.current.select();
    }
  }, [renamingId]);

  // Close context menu on outside click
  useEffect(() => {
    if (!contextMenu) return;
    const handleClick = (e: MouseEvent) => {
      if (
        contextMenuRef.current &&
        !contextMenuRef.current.contains(e.target as Node)
      ) {
        setContextMenu(null);
      }
    };
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, [contextMenu]);

  const handleContextMenu = useCallback(
    (e: React.MouseEvent, notebookId: string) => {
      e.preventDefault();
      setContextMenu({ notebookId, x: e.clientX, y: e.clientY });
    },
    []
  );

  const startRename = useCallback(
    (id: string, currentName: string) => {
      setContextMenu(null);
      setRenamingId(id);
      setRenameValue(currentName);
    },
    []
  );

  const commitRename = useCallback(() => {
    if (renamingId && renameValue.trim()) {
      onRenameNotebook(renamingId, renameValue.trim());
    }
    setRenamingId(null);
    setRenameValue("");
  }, [renamingId, renameValue, onRenameNotebook]);

  const cancelRename = useCallback(() => {
    setRenamingId(null);
    setRenameValue("");
  }, []);

  const handleDeleteNotebook = useCallback(
    (id: string, name: string) => {
      setContextMenu(null);
      if (window.confirm(`Delete notebook "${name}"? Notes will be moved to Trash.`)) {
        onDeleteNotebook(id);
      }
    },
    [onDeleteNotebook]
  );

  const isActive = (view: SidebarView, id?: string) => {
    if (view === "all") return appState.sidebarView === "all";
    if (view === "notebook")
      return (
        appState.sidebarView === "notebook" &&
        appState.selectedNotebookId === id
      );
    if (view === "tag")
      return (
        appState.sidebarView === "tag" && appState.selectedTagFilter === id
      );
    if (view === "trash") return appState.sidebarView === "trash";
    return false;
  };

  const itemClass = (active: boolean) =>
    `flex items-center gap-2 w-full px-3 py-1.5 rounded-md text-sm cursor-pointer transition-colors ${
      active
        ? "bg-accent text-accent-foreground font-medium"
        : "text-sidebar-foreground hover:bg-accent/50"
    }`;

  return (
    <aside
      data-testid="sidebar"
      className="flex flex-col h-full w-[220px] min-w-[220px] bg-sidebar text-sidebar-foreground border-r border-border select-none"
    >
      {/* All Notes */}
      <div className="px-2 pt-3 pb-1">
        <button
          data-testid="all-notes-btn"
          className={itemClass(isActive("all"))}
          onClick={() => onSelectView("all")}
        >
          <FileText className="size-4 shrink-0" />
          <span className="truncate">All Notes</span>
        </button>
      </div>

      {/* Notebooks */}
      <div className="px-2 pt-3">
        <button
          className="flex items-center gap-1 w-full px-1 pb-1 text-xs font-semibold uppercase tracking-wider text-sidebar-foreground/60 hover:text-sidebar-foreground transition-colors"
          onClick={() => setNotebooksExpanded((v) => !v)}
        >
          <ChevronDown
            className={`size-3 transition-transform ${
              notebooksExpanded ? "" : "-rotate-90"
            }`}
          />
          Notebooks
        </button>

        {notebooksExpanded && (
          <div className="flex flex-col gap-0.5">
            {notebooks.map((nb) => (
              <div
                key={nb.id}
                data-testid={`notebook-item-${nb.id}`}
                className="group relative"
                onContextMenu={(e) => handleContextMenu(e, nb.id)}
              >
                {renamingId === nb.id ? (
                  <div className="flex items-center gap-2 px-3 py-1">
                    <BookOpen className="size-4 shrink-0 text-sidebar-foreground/60" />
                    <input
                      ref={renameInputRef}
                      className="flex-1 min-w-0 bg-background border border-border rounded px-1.5 py-0.5 text-sm text-foreground outline-none focus:ring-1 focus:ring-ring"
                      value={renameValue}
                      onChange={(e) => setRenameValue(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter") commitRename();
                        if (e.key === "Escape") cancelRename();
                      }}
                      onBlur={commitRename}
                    />
                  </div>
                ) : (
                  <button
                    className={itemClass(isActive("notebook", nb.id))}
                    onClick={() => onSelectView("notebook", nb.id)}
                    onDoubleClick={() => startRename(nb.id, nb.name)}
                  >
                    <BookOpen className="size-4 shrink-0" />
                    <span className="flex-1 truncate text-left">{nb.name}</span>
                    <span className="ml-auto text-xs text-sidebar-foreground/50 tabular-nums">
                      {notebookNoteCount(nb.id)}
                    </span>
                    <span
                      className="opacity-0 group-hover:opacity-100 transition-opacity p-0.5 rounded hover:bg-accent"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleContextMenu(e, nb.id);
                      }}
                    >
                      <MoreHorizontal className="size-3.5" />
                    </span>
                  </button>
                )}
              </div>
            ))}

            <button
              data-testid="new-notebook-btn"
              className="flex items-center gap-2 w-full px-3 py-1.5 rounded-md text-sm text-sidebar-foreground/60 hover:text-sidebar-foreground hover:bg-accent/50 transition-colors"
              onClick={() => onCreateNotebook()}
            >
              <Plus className="size-4 shrink-0" />
              <span>New Notebook</span>
            </button>
          </div>
        )}
      </div>

      {/* Tags */}
      <div className="px-2 pt-3">
        <button
          className="flex items-center gap-1 w-full px-1 pb-1 text-xs font-semibold uppercase tracking-wider text-sidebar-foreground/60 hover:text-sidebar-foreground transition-colors"
          onClick={() => setTagsExpanded((v) => !v)}
        >
          <ChevronDown
            className={`size-3 transition-transform ${
              tagsExpanded ? "" : "-rotate-90"
            }`}
          />
          Tags
        </button>

        {tagsExpanded && (
          <div className="flex flex-col gap-0.5">
            {allTags.length === 0 && (
              <span className="px-3 py-1 text-xs text-sidebar-foreground/40">
                No tags yet
              </span>
            )}
            {allTags.map(({ tag, count }) => (
              <button
                key={tag}
                data-testid={`tag-item-${tag}`}
                className={itemClass(isActive("tag", tag))}
                onClick={() => onSelectView("tag", tag)}
              >
                <Tag className="size-4 shrink-0" />
                <span className="flex-1 truncate text-left">{tag}</span>
                <span className="ml-auto text-xs text-sidebar-foreground/50 tabular-nums">
                  {count}
                </span>
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Spacer */}
      <div className="flex-1" />

      {/* Trash */}
      <div className="px-2 pb-3">
        <button
          data-testid="trash-btn"
          className={itemClass(isActive("trash"))}
          onClick={() => onSelectView("trash")}
        >
          <Trash2 className="size-4 shrink-0" />
          <span className="flex-1 truncate text-left">Trash</span>
          {trashCount > 0 && (
            <span className="ml-auto text-xs bg-sidebar-accent text-sidebar-accent-foreground px-1.5 py-0.5 rounded-full tabular-nums">
              {trashCount}
            </span>
          )}
        </button>
      </div>

      {/* Context Menu */}
      {contextMenu && (
        <div
          ref={contextMenuRef}
          className="fixed z-50 min-w-[140px] bg-popover text-popover-foreground border border-border rounded-md shadow-md py-1"
          style={{ left: contextMenu.x, top: contextMenu.y }}
        >
          {(() => {
            const nb = notebooks.find((n) => n.id === contextMenu.notebookId);
            if (!nb) return null;
            return (
              <>
                <button
                  className="flex items-center gap-2 w-full px-3 py-1.5 text-sm hover:bg-accent hover:text-accent-foreground transition-colors"
                  onClick={() => startRename(nb.id, nb.name)}
                >
                  <Pencil className="size-3.5" />
                  Rename
                </button>
                <button
                  className="flex items-center gap-2 w-full px-3 py-1.5 text-sm text-destructive hover:bg-destructive/10 transition-colors"
                  onClick={() => handleDeleteNotebook(nb.id, nb.name)}
                >
                  <Trash2 className="size-3.5" />
                  Delete
                </button>
              </>
            );
          })()}
        </div>
      )}
    </aside>
  );
}
