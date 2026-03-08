import { v4 as uuidv4 } from "uuid";
import type { NoteFlowData, Notebook, Note } from "./types";

const STORAGE_KEY = "noteflow";

export function generateId(): string {
  return uuidv4();
}

export function getDefaultData(): NoteFlowData {
  return {
    settings: {
      theme: "system",
      isFirstLaunch: true,
    },
    notebooks: [],
    notes: [],
  };
}

export function getSampleData(): NoteFlowData {
  const now = new Date().toISOString();
  const notebookId = generateId();

  const sampleNotebook: Notebook = {
    id: notebookId,
    name: "Getting Started",
    createdAt: now,
    updatedAt: now,
    sortOrder: 0,
  };

  const sampleNotes: Note[] = [
    {
      id: generateId(),
      notebookId,
      title: "Welcome to NoteFlow! 👋",
      content:
        '<h2>Welcome to NoteFlow!</h2><p>NoteFlow is your <strong>private</strong>, <em>offline-first</em> note-taking app. All your data stays on your device — no accounts, no cloud, no tracking.</p><h3>Getting Started</h3><ul><li>Create <strong>notebooks</strong> to organize your notes by topic</li><li>Use <strong>tags</strong> to categorize notes across notebooks</li><li><strong>Pin</strong> important notes to keep them at the top</li><li><strong>Search</strong> across all your notes instantly</li></ul><p>Try editing this note to explore the rich text editor!</p>',
      plainText:
        "Welcome to NoteFlow! NoteFlow is your private, offline-first note-taking app. All your data stays on your device — no accounts, no cloud, no tracking. Getting Started Create notebooks to organize your notes by topic Use tags to categorize notes across notebooks Pin important notes to keep them at the top Search across all your notes instantly Try editing this note to explore the rich text editor!",
      tags: ["welcome", "getting-started"],
      isPinned: true,
      isDeleted: false,
      deletedAt: null,
      createdAt: now,
      updatedAt: now,
      sortOrder: 0,
    },
    {
      id: generateId(),
      notebookId,
      title: "Rich Text Features",
      content:
        '<h2>Rich Text Features</h2><p>NoteFlow supports a variety of formatting options:</p><h3>Text Formatting</h3><p><strong>Bold text</strong> — Ctrl+B</p><p><em>Italic text</em> — Ctrl+I</p><p><s>Strikethrough text</s> — Ctrl+Shift+X</p><h3>Lists</h3><ul><li>Bullet list item 1</li><li>Bullet list item 2</li></ul><ol><li>Ordered list item 1</li><li>Ordered list item 2</li></ol><h3>Task Lists</h3><ul data-type="taskList"><li data-type="taskItem" data-checked="true">Learn NoteFlow basics</li><li data-type="taskItem" data-checked="false">Create my first notebook</li><li data-type="taskItem" data-checked="false">Try all formatting options</li></ul><h3>Code Blocks</h3><pre><code>const greeting = "Hello, NoteFlow!";\nconsole.log(greeting);</code></pre><blockquote><p>This is a blockquote — great for highlighting important information.</p></blockquote><hr>',
      plainText:
        "Rich Text Features NoteFlow supports a variety of formatting options: Text Formatting Bold text Italic text Strikethrough text Lists Bullet list item 1 Bullet list item 2 Ordered list item 1 Ordered list item 2 Task Lists Learn NoteFlow basics Create my first notebook Try all formatting options Code Blocks const greeting = Hello, NoteFlow!; console.log(greeting); This is a blockquote — great for highlighting important information.",
      tags: ["getting-started", "features"],
      isPinned: false,
      isDeleted: false,
      deletedAt: null,
      createdAt: new Date(Date.now() - 60000).toISOString(),
      updatedAt: new Date(Date.now() - 60000).toISOString(),
      sortOrder: 1,
    },
    {
      id: generateId(),
      notebookId,
      title: "Keyboard Shortcuts",
      content:
        '<h2>Keyboard Shortcuts</h2><p>Master these shortcuts to work faster:</p><table><tbody><tr><td><strong>Ctrl + N</strong></td><td>Create new note</td></tr><tr><td><strong>Ctrl + Shift + N</strong></td><td>Create new notebook</td></tr><tr><td><strong>Ctrl + F</strong></td><td>Focus search bar</td></tr><tr><td><strong>Ctrl + B</strong></td><td>Bold text</td></tr><tr><td><strong>Ctrl + I</strong></td><td>Italic text</td></tr><tr><td><strong>Escape</strong></td><td>Close search / deselect</td></tr></tbody></table><p>💡 <em>Tip: You can also use Ctrl+Shift+1/2/3 to quickly apply heading levels.</em></p>',
      plainText:
        "Keyboard Shortcuts Master these shortcuts to work faster: Ctrl + N Create new note Ctrl + Shift + N Create new notebook Ctrl + F Focus search bar Ctrl + B Bold text Ctrl + I Italic text Escape Close search / deselect Tip: You can also use Ctrl+Shift+1/2/3 to quickly apply heading levels.",
      tags: ["getting-started", "productivity"],
      isPinned: false,
      isDeleted: false,
      deletedAt: null,
      createdAt: new Date(Date.now() - 120000).toISOString(),
      updatedAt: new Date(Date.now() - 120000).toISOString(),
      sortOrder: 2,
    },
  ];

  return {
    settings: {
      theme: "system",
      isFirstLaunch: false,
    },
    notebooks: [sampleNotebook],
    notes: sampleNotes,
  };
}

export function loadData(): NoteFlowData {
  if (typeof window === "undefined") return getDefaultData();

  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      const sample = getSampleData();
      saveData(sample);
      return sample;
    }
    return JSON.parse(raw) as NoteFlowData;
  } catch {
    return getDefaultData();
  }
}

export function saveData(data: NoteFlowData): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
  } catch (e) {
    console.error("Failed to save data to localStorage:", e);
  }
}

export function getStorageUsage(): { used: number; max: number; percentage: number } {
  if (typeof window === "undefined") return { used: 0, max: 5 * 1024 * 1024, percentage: 0 };
  const raw = localStorage.getItem(STORAGE_KEY) || "";
  const used = new Blob([raw]).size;
  const max = 5 * 1024 * 1024;
  return { used, max, percentage: (used / max) * 100 };
}

export function formatRelativeTime(dateString: string, locale: string = 'en'): string {
  const date = new Date(dateString);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffSec = Math.floor(diffMs / 1000);
  const diffMin = Math.floor(diffSec / 60);
  const diffHour = Math.floor(diffMin / 60);
  const diffDay = Math.floor(diffHour / 24);

  const rtf = new Intl.RelativeTimeFormat(locale, { numeric: 'auto' });

  if (diffSec < 60) return rtf.format(0, 'second');
  if (diffMin < 60) return rtf.format(-diffMin, 'minute');
  if (diffHour < 24) return rtf.format(-diffHour, 'hour');
  if (diffDay < 7) return rtf.format(-diffDay, 'day');
  return date.toLocaleDateString(locale, { month: 'short', day: 'numeric', year: 'numeric' });
}

export function getPlainText(html: string): string {
  if (typeof document === "undefined") return html.replace(/<[^>]*>/g, " ").replace(/\s+/g, " ").trim();
  const div = document.createElement("div");
  div.innerHTML = html;
  return div.textContent || div.innerText || "";
}

export function purgeOldTrash(data: NoteFlowData, days: number = 30): NoteFlowData {
  const cutoff = new Date(Date.now() - days * 24 * 60 * 60 * 1000).toISOString();
  return {
    ...data,
    notes: data.notes.filter(
      (n) => !n.isDeleted || !n.deletedAt || n.deletedAt > cutoff
    ),
  };
}
