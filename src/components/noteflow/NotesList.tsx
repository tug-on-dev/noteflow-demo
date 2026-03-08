"use client";

import { useCallback, useMemo, Fragment } from "react";
import { useTranslations, useLocale } from "next-intl";
import { Plus, Pin, PinOff, Trash2, RotateCcw } from "lucide-react";
import { cn } from "@/lib/utils";
import { formatRelativeTime } from "@/lib/storage";
import type { Note, SidebarView } from "@/lib/types";

interface NotesListProps {
  notes: Note[];
  selectedNoteId: string | null;
  searchQuery: string;
  sidebarView: SidebarView;
  onSelectNote: (id: string) => void;
  onCreateNote: () => void;
  onDeleteNote: (id: string) => void;
  onTogglePin: (id: string, isPinned: boolean) => void;
  onRestoreNote?: (id: string) => void;
  onPermanentlyDelete?: (id: string) => void;
  onEmptyTrash?: () => void;
}

function highlightMatches(text: string, query: string) {
  if (!query.trim()) return text;
  const escaped = query.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const parts = text.split(new RegExp(`(${escaped})`, "gi"));
  return parts.map((part, i) =>
    part.toLowerCase() === query.toLowerCase() ? (
      <mark key={i} className="bg-yellow-200 dark:bg-yellow-800 rounded-sm">
        {part}
      </mark>
    ) : (
      <Fragment key={i}>{part}</Fragment>
    )
  );
}

function NotesList({
  notes,
  selectedNoteId,
  searchQuery,
  sidebarView,
  onSelectNote,
  onCreateNote,
  onDeleteNote,
  onTogglePin,
  onRestoreNote,
  onPermanentlyDelete,
  onEmptyTrash,
}: NotesListProps) {
  const t = useTranslations('notesList');
  const tCommon = useTranslations('common');
  const locale = useLocale();
  const isTrash = sidebarView === "trash";

  const getViewTitle = (view: SidebarView) => {
    switch (view) {
      case "all": return t('allNotes');
      case "notebook": return t('notebook');
      case "tag": return t('taggedNotes');
      case "trash": return t('trash');
    }
  };

  const sortedNotes = useMemo(() => {
    const pinned = notes.filter((n) => n.isPinned);
    const unpinned = notes.filter((n) => !n.isPinned);
    return [...pinned, ...unpinned];
  }, [notes]);

  const truncate = useCallback((text: string, max: number) => {
    if (text.length <= max) return text;
    return text.slice(0, max).trimEnd() + "…";
  }, []);

  const untitledLabel = tCommon('untitled');

  return (
    <div
      data-testid="notes-list"
      className="flex w-[280px] flex-col border-r border-border bg-card text-card-foreground"
    >
      {/* Header */}
      <div className="flex items-center justify-between border-b border-border px-3 py-2">
        <h2 className="text-sm font-semibold">{getViewTitle(sidebarView)}</h2>
        <div className="flex items-center gap-1">
          {isTrash && notes.length > 0 && (
            <button
              data-testid="empty-trash-btn"
              onClick={onEmptyTrash}
              className="rounded-md px-2 py-1 text-xs text-destructive hover:bg-destructive/10"
            >
              {t('emptyTrash')}
            </button>
          )}
          {!isTrash && (
            <button
              data-testid="new-note-btn"
              onClick={onCreateNote}
              className="rounded-md p-1 hover:bg-accent"
              aria-label={t('newNote')}
            >
              <Plus className="h-4 w-4" />
            </button>
          )}
        </div>
      </div>

      {/* Notes list */}
      <div className="flex-1 overflow-y-auto">
        {sortedNotes.length === 0 ? (
          <div className="flex flex-col items-center justify-center gap-2 px-4 py-12 text-center text-sm text-muted-foreground">
            {isTrash ? (
              <p>{t('trashEmpty')}</p>
            ) : (
              <>
                <p>{t('noNotes')}</p>
                <button
                  onClick={onCreateNote}
                  className="mt-1 inline-flex items-center gap-1 rounded-md bg-primary px-3 py-1.5 text-xs font-medium text-primary-foreground hover:bg-primary/90"
                >
                  <Plus className="h-3 w-3" />
                  {t('createFirst')}
                </button>
              </>
            )}
          </div>
        ) : (
          sortedNotes.map((note) => {
            const title = note.title || untitledLabel;
            const preview = truncate(note.plainText, 100);
            const isSelected = note.id === selectedNoteId;

            return (
              <div
                key={note.id}
                data-testid={`note-item-${note.id}`}
                role="button"
                tabIndex={0}
                onClick={() => onSelectNote(note.id)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" || e.key === " ") {
                    e.preventDefault();
                    onSelectNote(note.id);
                  }
                }}
                className={cn(
                  "group cursor-pointer border-b border-border px-3 py-2 text-left",
                  isSelected ? "bg-accent" : "hover:bg-accent/50"
                )}
              >
                {/* Title row */}
                <div className="flex items-center gap-1">
                  {note.isPinned && !isTrash && (
                    <Pin className="h-3 w-3 shrink-0 text-muted-foreground" />
                  )}
                  <span className="truncate text-sm font-medium">
                    {highlightMatches(title, searchQuery)}
                  </span>
                </div>

                {/* Preview */}
                {preview && (
                  <p className="mt-0.5 line-clamp-2 text-xs text-muted-foreground">
                    {highlightMatches(preview, searchQuery)}
                  </p>
                )}

                {/* Tags */}
                {note.tags.length > 0 && (
                  <div className="mt-1 flex flex-wrap gap-1">
                    {note.tags.map((tag) => (
                      <span
                        key={tag}
                        className="rounded-full bg-secondary px-1.5 py-0.5 text-[10px] text-secondary-foreground"
                      >
                        {tag}
                      </span>
                    ))}
                  </div>
                )}

                {/* Footer: time + actions */}
                <div className="mt-1 flex items-center justify-between">
                  <span className="text-[11px] text-muted-foreground">
                    {formatRelativeTime(note.updatedAt, locale)}
                  </span>

                  {isTrash ? (
                    <div className="flex gap-1 opacity-0 group-hover:opacity-100">
                      <button
                        data-testid={`restore-note-${note.id}`}
                        onClick={(e) => {
                          e.stopPropagation();
                          onRestoreNote?.(note.id);
                        }}
                        className="rounded p-0.5 hover:bg-accent"
                        aria-label={t('restoreNote')}
                      >
                        <RotateCcw className="h-3.5 w-3.5" />
                      </button>
                      <button
                        data-testid={`permanent-delete-${note.id}`}
                        onClick={(e) => {
                          e.stopPropagation();
                          onPermanentlyDelete?.(note.id);
                        }}
                        className="rounded p-0.5 text-destructive hover:bg-destructive/10"
                        aria-label={t('deletePermanently')}
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  ) : (
                    <div className="flex gap-1 opacity-0 group-hover:opacity-100">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          onTogglePin(note.id, note.isPinned);
                        }}
                        className="rounded p-0.5 hover:bg-accent"
                        aria-label={note.isPinned ? t('unpinNote') : t('pinNote')}
                      >
                        {note.isPinned ? (
                          <PinOff className="h-3.5 w-3.5" />
                        ) : (
                          <Pin className="h-3.5 w-3.5" />
                        )}
                      </button>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          onDeleteNote(note.id);
                        }}
                        className="rounded p-0.5 text-destructive hover:bg-destructive/10"
                        aria-label={t('deleteNote')}
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  )}
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}

export default NotesList;
