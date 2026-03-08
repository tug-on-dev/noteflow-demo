"use client";

import React, { useState, useEffect, useRef, useCallback } from "react";
import { useTranslations, useLocale } from "next-intl";
import { useEditor, EditorContent } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Placeholder from "@tiptap/extension-placeholder";
import TaskList from "@tiptap/extension-task-list";
import TaskItem from "@tiptap/extension-task-item";
import CodeBlock from "@tiptap/extension-code-block";
import Highlight from "@tiptap/extension-highlight";
import {
  Bold,
  Italic,
  Strikethrough,
  Heading1,
  Heading2,
  Heading3,
  List,
  ListOrdered,
  CheckSquare,
  Code,
  Quote,
  Minus,
  X,
  Pin,
  Trash2,
  Download,
  FileText,
  FileDown,
} from "lucide-react";
import type { Note } from "@/lib/types";
import { formatRelativeTime } from "@/lib/storage";

interface NoteEditorProps {
  note: Note | null;
  onUpdateNote: (
    id: string,
    updates: Partial<Pick<Note, "title" | "content" | "tags" | "isPinned">>
  ) => void;
  onAddTag: (noteId: string, tag: string) => void;
  onRemoveTag: (noteId: string, tag: string) => void;
  onDeleteNote: (id: string) => void;
  onExportMarkdown: (note: Note) => void;
  onExportText: (note: Note) => void;
  allExistingTags: string[];
}

const editorStyles = `
.ProseMirror { outline: none; min-height: 200px; }
.ProseMirror h1 { font-size: 1.75rem; font-weight: 700; margin: 1rem 0 0.5rem; }
.ProseMirror h2 { font-size: 1.5rem; font-weight: 600; margin: 0.75rem 0 0.5rem; }
.ProseMirror h3 { font-size: 1.25rem; font-weight: 600; margin: 0.5rem 0 0.25rem; }
.ProseMirror ul, .ProseMirror ol { padding-left: 1.5rem; }
.ProseMirror ul { list-style-type: disc; }
.ProseMirror ol { list-style-type: decimal; }
.ProseMirror ul[data-type="taskList"] { list-style: none; padding-left: 0; }
.ProseMirror ul[data-type="taskList"] li { display: flex; align-items: flex-start; gap: 0.5rem; }
.ProseMirror ul[data-type="taskList"] li label { margin-top: 0.25rem; }
.ProseMirror pre { background: var(--muted); border-radius: 0.375rem; padding: 0.75rem; font-family: monospace; overflow-x: auto; }
.ProseMirror code { background: var(--muted); padding: 0.125rem 0.25rem; border-radius: 0.25rem; font-size: 0.875rem; }
.ProseMirror blockquote { border-left: 3px solid var(--border); padding-left: 1rem; color: var(--muted-foreground); margin: 0.5rem 0; }
.ProseMirror hr { border-color: var(--border); margin: 1rem 0; }
.ProseMirror p { margin: 0.25rem 0; }
.ProseMirror mark { background-color: #fef08a; border-radius: 0.125rem; }
`;

function ToolbarButton({
  onClick,
  active,
  disabled,
  title,
  children,
}: {
  onClick: () => void;
  active?: boolean;
  disabled?: boolean;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      title={title}
      className={`p-1.5 rounded transition-colors ${
        active
          ? "bg-accent text-accent-foreground"
          : "text-muted-foreground hover:bg-accent/50 hover:text-foreground"
      } disabled:opacity-50 disabled:pointer-events-none`}
    >
      {children}
    </button>
  );
}

function NoteEditor({
  note,
  onUpdateNote,
  onAddTag,
  onRemoveTag,
  onDeleteNote,
  onExportMarkdown,
  onExportText,
  allExistingTags,
}: NoteEditorProps) {
  const t = useTranslations('editor');
  const tCommon = useTranslations('common');
  const locale = useLocale();
  const [tagInput, setTagInput] = useState("");
  const [showTagSuggestions, setShowTagSuggestions] = useState(false);
  const titleRef = useRef<HTMLInputElement>(null);
  const tagInputRef = useRef<HTMLInputElement>(null);
  const prevNoteIdRef = useRef<string | null>(null);

  const isReadOnly = note?.isDeleted ?? false;

  const editor = useEditor({
    extensions: [
      StarterKit.configure({ codeBlock: false }),
      TaskList,
      TaskItem.configure({ nested: true }),
      CodeBlock,
      Highlight,
      Placeholder.configure({ placeholder: t('startWriting') }),
    ],
    editable: !isReadOnly,
    content: note?.content ?? "",
    immediatelyRender: false,
    onUpdate: ({ editor: ed }) => {
      if (note && !note.isDeleted) {
        onUpdateNote(note.id, { content: ed.getHTML() });
      }
    },
  });

  // Sync editor content when note ID changes (not on every note object change)
  const noteId = note?.id ?? null;
  const noteContent = note?.content ?? "";

  useEffect(() => {
    if (!editor) return;

    if (noteId && noteId !== prevNoteIdRef.current) {
      editor.commands.setContent(noteContent);
      if (!note?.title && titleRef.current) {
        titleRef.current.focus();
      }
    } else if (!noteId) {
      editor.commands.setContent("");
    }

    prevNoteIdRef.current = noteId;
  // Only re-run when noteId changes, not on content edits
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [editor, noteId]);

  // Sync editability separately
  useEffect(() => {
    if (editor) editor.setEditable(!isReadOnly);
  }, [editor, isReadOnly]);

  const handleTitleChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      if (note) {
        onUpdateNote(note.id, { title: e.target.value });
      }
    },
    [note, onUpdateNote]
  );

  const handleAddTag = useCallback(
    (tag: string) => {
      const trimmed = tag.trim().toLowerCase();
      if (!note || !trimmed || note.tags.includes(trimmed)) return;
      onAddTag(note.id, trimmed);
      setTagInput("");
      setShowTagSuggestions(false);
    },
    [note, onAddTag]
  );

  const handleTagKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLInputElement>) => {
      if (e.key === "Enter") {
        e.preventDefault();
        handleAddTag(tagInput);
      } else if (e.key === "Escape") {
        setShowTagSuggestions(false);
      }
    },
    [tagInput, handleAddTag]
  );

  const filteredTagSuggestions = allExistingTags.filter(
    (t) =>
      tagInput &&
      t.toLowerCase().includes(tagInput.toLowerCase()) &&
      !note?.tags.includes(t)
  );

  // Empty state
  if (!note) {
    return (
      <div
        data-testid="note-editor"
        className="flex-1 flex items-center justify-center text-muted-foreground"
      >
        <div className="text-center">
          <FileText className="h-12 w-12 mx-auto mb-3 opacity-50" />
          <p className="text-lg">{t('selectOrCreate')}</p>
        </div>
      </div>
    );
  }

  const iconSize = 16;

  return (
    <div data-testid="note-editor" className="flex flex-col h-full">
      <style>{editorStyles}</style>

      {/* Header with title and actions */}
      <div className="border-b px-4 py-3 flex-shrink-0">
        <div className="flex items-center gap-2">
          <input
            ref={titleRef}
            data-testid="note-title-input"
            type="text"
            value={note.title}
            onChange={handleTitleChange}
            readOnly={isReadOnly}
            placeholder={tCommon('untitled')}
            className="flex-1 text-2xl font-bold bg-transparent border-none outline-none placeholder:text-muted-foreground/50"
          />
          <div className="flex items-center gap-1">
            <button
              type="button"
              title={note.isPinned ? t('unpinNote') : t('pinNote')}
              onClick={() =>
                onUpdateNote(note.id, { isPinned: !note.isPinned })
              }
              disabled={isReadOnly}
              className={`p-1.5 rounded transition-colors ${
                note.isPinned
                  ? "text-amber-500"
                  : "text-muted-foreground hover:text-foreground"
              } disabled:opacity-50`}
            >
              <Pin className="h-4 w-4" />
            </button>
            <button
              type="button"
              title={t('exportMarkdown')}
              onClick={() => onExportMarkdown(note)}
              className="p-1.5 rounded text-muted-foreground hover:text-foreground transition-colors"
            >
              <Download className="h-4 w-4" />
            </button>
            <button
              type="button"
              title={t('exportText')}
              onClick={() => onExportText(note)}
              className="p-1.5 rounded text-muted-foreground hover:text-foreground transition-colors"
            >
              <FileDown className="h-4 w-4" />
            </button>
            {!isReadOnly && (
              <button
                type="button"
                title={t('deleteNote')}
                onClick={() => onDeleteNote(note.id)}
                className="p-1.5 rounded text-muted-foreground hover:text-destructive transition-colors"
              >
                <Trash2 className="h-4 w-4" />
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Deleted note banner */}
      {isReadOnly && (
        <div className="bg-destructive/10 text-destructive px-4 py-2 text-sm flex-shrink-0">
          {t('trashBanner')}
        </div>
      )}

      {/* Toolbar */}
      {!isReadOnly && editor && (
        <div
          data-testid="editor-toolbar"
          className="border-b px-4 py-1.5 flex items-center gap-0.5 flex-wrap flex-shrink-0"
        >
          <ToolbarButton
            onClick={() => editor.chain().focus().toggleBold().run()}
            active={editor.isActive("bold")}
            title={t('toolbar.bold')}
          >
            <Bold size={iconSize} />
          </ToolbarButton>
          <ToolbarButton
            onClick={() => editor.chain().focus().toggleItalic().run()}
            active={editor.isActive("italic")}
            title={t('toolbar.italic')}
          >
            <Italic size={iconSize} />
          </ToolbarButton>
          <ToolbarButton
            onClick={() => editor.chain().focus().toggleStrike().run()}
            active={editor.isActive("strike")}
            title={t('toolbar.strikethrough')}
          >
            <Strikethrough size={iconSize} />
          </ToolbarButton>

          <div className="w-px h-5 bg-border mx-1" />

          <ToolbarButton
            onClick={() =>
              editor.chain().focus().toggleHeading({ level: 1 }).run()
            }
            active={editor.isActive("heading", { level: 1 })}
            title={t('toolbar.heading1')}
          >
            <Heading1 size={iconSize} />
          </ToolbarButton>
          <ToolbarButton
            onClick={() =>
              editor.chain().focus().toggleHeading({ level: 2 }).run()
            }
            active={editor.isActive("heading", { level: 2 })}
            title={t('toolbar.heading2')}
          >
            <Heading2 size={iconSize} />
          </ToolbarButton>
          <ToolbarButton
            onClick={() =>
              editor.chain().focus().toggleHeading({ level: 3 }).run()
            }
            active={editor.isActive("heading", { level: 3 })}
            title={t('toolbar.heading3')}
          >
            <Heading3 size={iconSize} />
          </ToolbarButton>

          <div className="w-px h-5 bg-border mx-1" />

          <ToolbarButton
            onClick={() => editor.chain().focus().toggleBulletList().run()}
            active={editor.isActive("bulletList")}
            title={t('toolbar.bulletList')}
          >
            <List size={iconSize} />
          </ToolbarButton>
          <ToolbarButton
            onClick={() => editor.chain().focus().toggleOrderedList().run()}
            active={editor.isActive("orderedList")}
            title={t('toolbar.orderedList')}
          >
            <ListOrdered size={iconSize} />
          </ToolbarButton>
          <ToolbarButton
            onClick={() => editor.chain().focus().toggleTaskList().run()}
            active={editor.isActive("taskList")}
            title={t('toolbar.taskList')}
          >
            <CheckSquare size={iconSize} />
          </ToolbarButton>

          <div className="w-px h-5 bg-border mx-1" />

          <ToolbarButton
            onClick={() => editor.chain().focus().toggleCodeBlock().run()}
            active={editor.isActive("codeBlock")}
            title={t('toolbar.codeBlock')}
          >
            <Code size={iconSize} />
          </ToolbarButton>
          <ToolbarButton
            onClick={() => editor.chain().focus().toggleBlockquote().run()}
            active={editor.isActive("blockquote")}
            title={t('toolbar.blockquote')}
          >
            <Quote size={iconSize} />
          </ToolbarButton>
          <ToolbarButton
            onClick={() => editor.chain().focus().setHorizontalRule().run()}
            title={t('toolbar.horizontalRule')}
          >
            <Minus size={iconSize} />
          </ToolbarButton>
        </div>
      )}

      {/* Editor content */}
      <div
        data-testid="editor-content"
        className="flex-1 overflow-y-auto px-4 py-3"
      >
        <EditorContent editor={editor} />
      </div>

      {/* Tags section */}
      <div
        data-testid="note-tags"
        className="border-t px-4 py-3 flex-shrink-0"
      >
        <div className="flex flex-wrap items-center gap-2">
          {note.tags.map((tag) => (
            <span
              key={tag}
              className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-accent text-accent-foreground text-xs"
            >
              #{tag}
              {!isReadOnly && (
                <button
                  type="button"
                  onClick={() => onRemoveTag(note.id, tag)}
                  className="hover:text-destructive transition-colors"
                >
                  <X size={12} />
                </button>
              )}
            </span>
          ))}
          {!isReadOnly && (
            <div className="relative">
              <input
                ref={tagInputRef}
                data-testid="tag-input"
                type="text"
                value={tagInput}
                onChange={(e) => {
                  setTagInput(e.target.value);
                  setShowTagSuggestions(true);
                }}
                onKeyDown={handleTagKeyDown}
                onFocus={() => setShowTagSuggestions(true)}
                onBlur={() =>
                  setTimeout(() => setShowTagSuggestions(false), 150)
                }
                placeholder={t('addTag')}
                className="text-xs bg-transparent border border-dashed border-border rounded-full px-2 py-0.5 w-24 outline-none focus:border-foreground transition-colors placeholder:text-muted-foreground/50"
              />
              {showTagSuggestions && filteredTagSuggestions.length > 0 && (
                <div className="absolute bottom-full left-0 mb-1 w-40 bg-popover border border-border rounded-md shadow-md py-1 z-10 max-h-32 overflow-y-auto">
                  {filteredTagSuggestions.map((suggestion) => (
                    <button
                      key={suggestion}
                      type="button"
                      onMouseDown={(e) => e.preventDefault()}
                      onClick={() => handleAddTag(suggestion)}
                      className="w-full text-left px-3 py-1 text-xs hover:bg-accent transition-colors"
                    >
                      #{suggestion}
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Metadata footer */}
      <div className="border-t px-4 py-2 flex-shrink-0 text-xs text-muted-foreground flex items-center gap-4">
        <span>{t('created', { time: formatRelativeTime(note.createdAt, locale) })}</span>
        <span>{t('updated', { time: formatRelativeTime(note.updatedAt, locale) })}</span>
      </div>
    </div>
  );
}

export default NoteEditor;
