import { test, expect } from "@playwright/test";
import { freshStart } from "./helpers";

test.describe("Note Lifecycle", () => {
  test("create a new note", async ({ page }) => {
    await freshStart(page);

    const notesList = page.getByTestId("notes-list");
    const initialCount = await notesList
      .locator("[data-testid^='note-item-']")
      .count();

    await page.getByTestId("new-note-btn").click();

    const noteItems = notesList.locator("[data-testid^='note-item-']");
    await expect(noteItems).toHaveCount(initialCount + 1);

    // New note should be the first (top) item
    await expect(noteItems.first()).toBeVisible();
  });

  test("edit note title", async ({ page }) => {
    await freshStart(page);

    // Create a new note
    await page.getByTestId("new-note-btn").click();

    const titleInput = page.getByTestId("note-title-input");
    await titleInput.fill("My Custom Title");
    await page.waitForTimeout(500);

    // Verify the title appears in the notes list
    const notesList = page.getByTestId("notes-list");
    await expect(notesList.getByText("My Custom Title")).toBeVisible();
  });

  test("edit note content", async ({ page }) => {
    await freshStart(page);

    // Click the first note to open it
    const firstNote = page
      .getByTestId("notes-list")
      .locator("[data-testid^='note-item-']")
      .first();
    await firstNote.click();

    // Click into the editor and type content
    const editor = page.getByTestId("editor-content").locator(".ProseMirror");
    await editor.click();
    await page.keyboard.type("Hello world from the editor");
    await page.waitForTimeout(500);

    // Verify content is saved in localStorage
    const stored = await page.evaluate(() => {
      const data = JSON.parse(localStorage.getItem("noteflow") || "{}");
      return data.notes?.[0]?.plainText || "";
    });
    expect(stored).toContain("Hello world from the editor");
  });

  test("pin a note", async ({ page }) => {
    await freshStart(page);

    const notesList = page.getByTestId("notes-list");
    const noteItems = notesList.locator("[data-testid^='note-item-']");

    // Get the title of the last note
    const lastNote = noteItems.last();
    const lastNoteTitle = await lastNote
      .locator("span.truncate")
      .textContent();

    // Hover to reveal pin button, then click it
    await lastNote.hover();
    await lastNote.getByLabel("Pin note").click();
    await page.waitForTimeout(500);

    // The pinned note should now be at the top
    const firstNote = noteItems.first();
    await expect(firstNote).toContainText(lastNoteTitle!.trim());
  });

  test("unpin a note", async ({ page }) => {
    await freshStart(page);

    const notesList = page.getByTestId("notes-list");
    const noteItems = notesList.locator("[data-testid^='note-item-']");

    // First, pin a note
    const lastNote = noteItems.last();
    await lastNote.hover();
    await lastNote.getByLabel("Pin note").click();
    await page.waitForTimeout(500);

    // Now unpin it
    const firstNote = noteItems.first();
    await firstNote.hover();
    await firstNote.getByLabel("Unpin note").click();
    await page.waitForTimeout(500);

    // Verify no notes have "Unpin note" button visible on hover
    const topNote = noteItems.first();
    await topNote.hover();
    await expect(topNote.getByLabel("Pin note")).toBeVisible();
  });

  test("soft-delete a note", async ({ page }) => {
    await freshStart(page);

    const notesList = page.getByTestId("notes-list");
    const noteItems = notesList.locator("[data-testid^='note-item-']");
    const initialCount = await noteItems.count();

    // Get the title of the first note before deleting
    const firstNote = noteItems.first();
    const noteTitle = await firstNote
      .locator("span.truncate")
      .textContent();

    // Hover to reveal delete button, then click it
    await firstNote.hover();
    await firstNote.getByLabel("Delete note").click();
    await page.waitForTimeout(500);

    // Note should disappear from the list
    await expect(noteItems).toHaveCount(initialCount - 1);

    // Verify the deleted note is not visible in the list
    if (noteTitle) {
      await expect(noteItems.first()).not.toContainText(noteTitle.trim());
    }
  });

  test("note preview shows first ~100 chars of content", async ({ page }) => {
    await freshStart(page);

    // Create a new note with long content
    await page.getByTestId("new-note-btn").click();

    const titleInput = page.getByTestId("note-title-input");
    await titleInput.fill("Preview Test Note");

    const editor = page.getByTestId("editor-content").locator(".ProseMirror");
    await editor.click();

    const longContent =
      "This is a test note with enough content to verify the preview truncation behavior in the notes list sidebar panel.";
    await page.keyboard.type(longContent);
    await page.waitForTimeout(500);

    // Find our note in the list by its title, then check preview
    const notesList = page.getByTestId("notes-list");
    const ourNote = notesList
      .locator("[data-testid^='note-item-']")
      .filter({ hasText: "Preview Test Note" });
    const preview = ourNote.locator("p.line-clamp-2");

    await expect(preview).toBeVisible();
    const previewText = await preview.textContent();
    expect(previewText).toBeTruthy();
    // Preview should contain the beginning of the content
    expect(previewText).toContain("This is a test note");
  });

  test("timestamps are displayed", async ({ page }) => {
    await freshStart(page);

    // Click the first note to open it in the editor
    const firstNote = page
      .getByTestId("notes-list")
      .locator("[data-testid^='note-item-']")
      .first();
    await firstNote.click();

    // Verify "Created" and "Updated" timestamps in the editor footer
    await expect(page.getByText(/^Created/)).toBeVisible();
    await expect(page.getByText(/^Updated/)).toBeVisible();

    // Verify relative time is shown in the notes list
    const listTimestamp = firstNote.locator("span.text-\\[11px\\]");
    await expect(listTimestamp).toBeVisible();
  });
});
