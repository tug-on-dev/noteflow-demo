import { test, expect } from "@playwright/test";
import { freshStart } from "./helpers";

test.describe("Search", () => {
  test("search finds notes by title", async ({ page }) => {
    await freshStart(page);

    const searchInput = page.getByTestId("search-input");
    await searchInput.fill("Welcome");

    // Notes list should contain only notes matching the title
    const noteItems = page.getByTestId("notes-list").locator("[data-testid^='note-item-']");
    await expect(noteItems).toHaveCount(1);
    await expect(noteItems.first()).toContainText(/welcome/i);
  });

  test("search finds notes by content", async ({ page }) => {
    await freshStart(page);

    // Select a note and add recognizable content
    const firstNote = page.getByTestId("notes-list").locator("[data-testid^='note-item-']").first();
    await firstNote.click();

    const titleInput = page.getByTestId("note-title-input");
    await titleInput.fill("UniqueTestNote");

    const editor = page.getByTestId("editor-content");
    await editor.click();
    await page.keyboard.type("xylophoneTestContent");

    // Wait for save debounce
    await page.waitForTimeout(500);

    // Search by the content text
    const searchInput = page.getByTestId("search-input");
    await searchInput.fill("xylophoneTestContent");

    const noteItems = page.getByTestId("notes-list").locator("[data-testid^='note-item-']");
    await expect(noteItems).toHaveCount(1);
    await expect(noteItems.first()).toContainText("UniqueTestNote");
  });

  test("search results update as user types", async ({ page }) => {
    await freshStart(page);

    const searchInput = page.getByTestId("search-input");
    const noteItems = page.getByTestId("notes-list").locator("[data-testid^='note-item-']");

    // Initially all notes visible
    const initialCount = await noteItems.count();
    expect(initialCount).toBeGreaterThanOrEqual(3);

    // Type partial query — results should narrow
    await searchInput.fill("Key");
    await expect(noteItems).toHaveCount(1);

    // Type more to further narrow (or same)
    await searchInput.fill("Keyboard");
    await expect(noteItems).toHaveCount(1);
    await expect(noteItems.first()).toContainText(/keyboard/i);
  });

  test("clear search button works", async ({ page }) => {
    await freshStart(page);

    const searchInput = page.getByTestId("search-input");
    await searchInput.fill("Welcome");

    const noteItems = page.getByTestId("notes-list").locator("[data-testid^='note-item-']");
    await expect(noteItems).toHaveCount(1);

    // Click the clear search button
    await page.getByTestId("clear-search-btn").click();

    // Search input should be empty and all notes visible again
    await expect(searchInput).toHaveValue("");
    const allCount = await noteItems.count();
    expect(allCount).toBeGreaterThanOrEqual(3);
  });

  test("keyboard shortcut Ctrl+F focuses search bar", async ({ page }) => {
    await freshStart(page);

    // Click somewhere else first to ensure search is not focused
    await page.getByTestId("noteflow-app").click();

    // Press Ctrl+F
    await page.keyboard.press("Control+f");

    // Search input should be focused
    await expect(page.getByTestId("search-input")).toBeFocused();
  });

  test("empty search shows all notes", async ({ page }) => {
    await freshStart(page);

    const noteItems = page.getByTestId("notes-list").locator("[data-testid^='note-item-']");
    const initialCount = await noteItems.count();

    // Type something to filter
    const searchInput = page.getByTestId("search-input");
    await searchInput.fill("Welcome");
    await expect(noteItems).toHaveCount(1);

    // Clear the search to empty string
    await searchInput.fill("");

    // All notes should be visible again
    await expect(noteItems).toHaveCount(initialCount);
  });
});
