import { test, expect } from "@playwright/test";
import { freshStart } from "./helpers";

test.describe("Trash", () => {
  test("deleted note appears in Trash view", async ({ page }) => {
    await freshStart(page);

    // Select the first note and capture its title
    const firstNote = page.getByTestId("notes-list").locator("[data-testid^='note-item-']").first();
    await firstNote.click();
    const noteTitle = await page.getByTestId("note-title-input").inputValue();

    // Delete the note using keyboard shortcut
    await page.keyboard.press("Delete");

    // Navigate to Trash
    await page.getByTestId("trash-btn").click();

    // The deleted note should appear in the trash list
    const trashNotes = page.getByTestId("notes-list").locator("[data-testid^='note-item-']");
    await expect(trashNotes.filter({ hasText: noteTitle })).toHaveCount(1);
  });

  test("restore a note from Trash", async ({ page }) => {
    await freshStart(page);

    // Select a note and get its title
    const firstNote = page.getByTestId("notes-list").locator("[data-testid^='note-item-']").first();
    await firstNote.click();
    const noteTitle = await page.getByTestId("note-title-input").inputValue();

    // Get the note's testid to extract the ID
    const noteTestId = await firstNote.getAttribute("data-testid");
    const noteId = noteTestId?.replace("note-item-", "") ?? "";

    // Delete the note
    await page.keyboard.press("Delete");

    // Go to Trash
    await page.getByTestId("trash-btn").click();

    // Hover over the deleted note to reveal restore button, then restore
    const trashedNote = page.getByTestId(`note-item-${noteId}`);
    await trashedNote.hover();
    await page.getByTestId(`restore-note-${noteId}`).click();

    // Go back to All Notes
    await page.getByTestId("all-notes-btn").click();

    // The restored note should be back in the list
    const noteItems = page.getByTestId("notes-list").locator("[data-testid^='note-item-']");
    await expect(noteItems.filter({ hasText: noteTitle })).toHaveCount(1);
  });

  test("permanently delete a note from Trash", async ({ page }) => {
    await freshStart(page);

    // Select a note and get its ID
    const firstNote = page.getByTestId("notes-list").locator("[data-testid^='note-item-']").first();
    await firstNote.click();
    const noteTestId = await firstNote.getAttribute("data-testid");
    const noteId = noteTestId?.replace("note-item-", "") ?? "";
    const noteTitle = await page.getByTestId("note-title-input").inputValue();

    // Delete the note
    await page.keyboard.press("Delete");

    // Go to Trash
    await page.getByTestId("trash-btn").click();

    // Hover and permanently delete
    const trashedNote = page.getByTestId(`note-item-${noteId}`);
    await trashedNote.hover();
    await page.getByTestId(`permanent-delete-${noteId}`).click();

    // The note should no longer exist in trash
    await expect(page.getByTestId(`note-item-${noteId}`)).toBeHidden();

    // Go to All Notes — should not be there either
    await page.getByTestId("all-notes-btn").click();
    const noteItems = page.getByTestId("notes-list").locator("[data-testid^='note-item-']");
    await expect(noteItems.filter({ hasText: noteTitle })).toHaveCount(0);
  });

  test("trash count badge updates correctly", async ({ page }) => {
    await freshStart(page);

    const trashBtn = page.getByTestId("trash-btn");

    // Initially no trash count badge (or count is 0)
    await expect(trashBtn).not.toContainText(/[1-9]/);

    // Delete a note
    const firstNote = page.getByTestId("notes-list").locator("[data-testid^='note-item-']").first();
    await firstNote.click();
    await page.keyboard.press("Delete");

    // Trash badge should show 1
    await expect(trashBtn).toContainText("1");

    // Delete another note
    const secondNote = page.getByTestId("notes-list").locator("[data-testid^='note-item-']").first();
    await secondNote.click();
    await page.keyboard.press("Delete");

    // Trash badge should show 2
    await expect(trashBtn).toContainText("2");
  });

  test("restored note returns to the notes list", async ({ page }) => {
    await freshStart(page);

    // Count initial notes
    const noteItems = page.getByTestId("notes-list").locator("[data-testid^='note-item-']");
    const initialCount = await noteItems.count();

    // Select and delete a note
    const firstNote = noteItems.first();
    await firstNote.click();
    const noteTestId = await firstNote.getAttribute("data-testid");
    const noteId = noteTestId?.replace("note-item-", "") ?? "";
    const noteTitle = await page.getByTestId("note-title-input").inputValue();

    await page.keyboard.press("Delete");

    // Verify note count decreased
    await expect(noteItems).toHaveCount(initialCount - 1);

    // Go to Trash, restore the note
    await page.getByTestId("trash-btn").click();
    const trashedNote = page.getByTestId(`note-item-${noteId}`);
    await trashedNote.hover();
    await page.getByTestId(`restore-note-${noteId}`).click();

    // Go back to All Notes
    await page.getByTestId("all-notes-btn").click();

    // Note count should be back to initial
    await expect(noteItems).toHaveCount(initialCount);

    // The restored note should be visible
    await expect(noteItems.filter({ hasText: noteTitle })).toHaveCount(1);
  });
});
