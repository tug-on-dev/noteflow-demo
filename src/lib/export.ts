"use client";

import type { Note } from "@/lib/types";

export function exportAsMarkdown(note: Note) {
  const turndownContent = htmlToMarkdown(note.content);
  const content = `# ${note.title || "Untitled"}\n\n${turndownContent}`;
  downloadFile(`${note.title || "untitled"}.md`, content, "text/markdown");
}

export function exportAsText(note: Note) {
  const content = `${note.title || "Untitled"}\n\n${note.plainText}`;
  downloadFile(`${note.title || "untitled"}.txt`, content, "text/plain");
}

function downloadFile(filename: string, content: string, mimeType: string) {
  const blob = new Blob([content], { type: mimeType });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename.replace(/[^a-z0-9._-]/gi, "_");
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

function htmlToMarkdown(html: string): string {
  let md = html;
  // Headings
  md = md.replace(/<h1[^>]*>(.*?)<\/h1>/gi, "# $1\n\n");
  md = md.replace(/<h2[^>]*>(.*?)<\/h2>/gi, "## $1\n\n");
  md = md.replace(/<h3[^>]*>(.*?)<\/h3>/gi, "### $1\n\n");
  // Bold, italic, strikethrough
  md = md.replace(/<strong[^>]*>(.*?)<\/strong>/gi, "**$1**");
  md = md.replace(/<em[^>]*>(.*?)<\/em>/gi, "*$1*");
  md = md.replace(/<s[^>]*>(.*?)<\/s>/gi, "~~$1~~");
  // Code blocks
  md = md.replace(/<pre[^>]*><code[^>]*>([\s\S]*?)<\/code><\/pre>/gi, "\n```\n$1\n```\n");
  md = md.replace(/<code[^>]*>(.*?)<\/code>/gi, "`$1`");
  // Blockquotes
  md = md.replace(/<blockquote[^>]*>([\s\S]*?)<\/blockquote>/gi, (_, content) => {
    return content.replace(/<p[^>]*>(.*?)<\/p>/gi, "> $1\n").replace(/<[^>]*>/g, "");
  });
  // Lists
  md = md.replace(/<ul[^>]*data-type="taskList"[^>]*>([\s\S]*?)<\/ul>/gi, (_, items) => {
    return items.replace(
      /<li[^>]*data-checked="(true|false)"[^>]*>([\s\S]*?)<\/li>/gi,
      (_: string, checked: string, text: string) =>
        `- [${checked === "true" ? "x" : " "}] ${text.replace(/<[^>]*>/g, "").trim()}\n`
    );
  });
  md = md.replace(/<ul[^>]*>([\s\S]*?)<\/ul>/gi, (_, items) => {
    return items.replace(/<li[^>]*>([\s\S]*?)<\/li>/gi, "- $1\n").replace(/<[^>]*>/g, "");
  });
  md = md.replace(/<ol[^>]*>([\s\S]*?)<\/ol>/gi, (_, items) => {
    let i = 0;
    return items.replace(/<li[^>]*>([\s\S]*?)<\/li>/gi, () => {
      i++;
      return `${i}. ` + arguments[1] + "\n";
    }).replace(/<[^>]*>/g, "");
  });
  // Horizontal rule
  md = md.replace(/<hr[^>]*\/?>/gi, "\n---\n");
  // Paragraphs and breaks
  md = md.replace(/<p[^>]*>(.*?)<\/p>/gi, "$1\n\n");
  md = md.replace(/<br[^>]*\/?>/gi, "\n");
  // Strip remaining tags
  md = md.replace(/<[^>]*>/g, "");
  // Decode entities
  md = md.replace(/&amp;/g, "&").replace(/&lt;/g, "<").replace(/&gt;/g, ">").replace(/&quot;/g, '"').replace(/&#39;/g, "'");
  // Clean up extra whitespace
  md = md.replace(/\n{3,}/g, "\n\n").trim();
  return md;
}
