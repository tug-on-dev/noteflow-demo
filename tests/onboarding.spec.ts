import { test, expect } from "@playwright/test";
import { freshStart } from "./helpers";

test.describe("Onboarding – first-launch experience", () => {
  test("sample data is visible on first launch with 1 notebook and 3 notes", async ({
    page,
  }) => {
    await freshStart(page);

    const sidebar = page.getByTestId("sidebar");
    await expect(sidebar.getByText("Getting Started")).toBeVisible();

    const notesList = page.getByTestId("notes-list");
    // Note title includes emoji: "Welcome to NoteFlow! 👋"; use first() to avoid
    // matching both the title span and the preview paragraph
    await expect(notesList.getByText("Welcome to NoteFlow!").first()).toBeVisible();
    await expect(notesList.getByText("Rich Text Features").first()).toBeVisible();
    await expect(notesList.getByText("Keyboard Shortcuts").first()).toBeVisible();
  });

  test("sample notebook appears in the sidebar", async ({ page }) => {
    await freshStart(page);

    const sidebar = page.getByTestId("sidebar");
    // Notebooks section is expanded by default — no toggle needed
    await expect(sidebar.getByText("Getting Started")).toBeVisible();
  });

  test("sample notes appear in the notes list", async ({ page }) => {
    await freshStart(page);

    const notesList = page.getByTestId("notes-list");
    const noteItems = notesList.locator('[data-testid^="note-item-"]');
    await expect(noteItems).toHaveCount(3);
  });

  test("first note is auto-selected and visible in editor", async ({
    page,
  }) => {
    await freshStart(page);

    const editor = page.getByTestId("note-editor");
    await expect(editor).toBeVisible();

    const titleInput = page.getByTestId("note-title-input");
    await expect(titleInput).toBeVisible();
    await expect(titleInput).toHaveValue(/Welcome to NoteFlow/);
  });

  test("sample data can be deleted – delete a note and verify it goes to trash", async ({
    page,
  }) => {
    await freshStart(page);

    const notesList = page.getByTestId("notes-list");
    const firstNoteItem = notesList
      .locator('[data-testid^="note-item-"]')
      .first();
    await firstNoteItem.hover();

    // The delete button (Trash2 icon) appears on hover inside the note item
    const deleteBtn = firstNoteItem.getByRole("button", { name: /delete/i });
    await deleteBtn.click();

    // Should now have 2 notes in the list
    await expect(
      notesList.locator('[data-testid^="note-item-"]')
    ).toHaveCount(2);

    // Navigate to trash and verify the deleted note is there
    await page.getByTestId("trash-btn").click();
    const trashList = page.getByTestId("notes-list");
    await expect(
      trashList.locator('[data-testid^="note-item-"]')
    ).toHaveCount(1);
  });
});
