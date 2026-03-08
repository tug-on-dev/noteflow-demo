import { test, expect } from "@playwright/test";
import { freshStart, createNotebook } from "./helpers";

test.describe("Keyboard shortcuts", () => {
  test("Ctrl+N creates a new note", async ({ page }) => {
    await freshStart(page);

    // Click on the app body to ensure focus is not on an input
    await page.getByTestId("noteflow-app").click();

    await page.keyboard.press("Control+n");

    // A new note should be created and the title input should be visible
    await expect(page.getByTestId("note-title-input")).toBeVisible();
    await expect(page.getByTestId("note-title-input")).toHaveValue("");
  });

  test("Ctrl+Shift+N creates a new notebook", async ({ page }) => {
    await freshStart(page);

    // Use the createNotebook helper (keyboard shortcut with uppercase N)
    await createNotebook(page);

    // A new notebook should appear in the sidebar
    await expect(
      page.getByTestId("sidebar").getByText("Untitled Notebook"),
    ).toBeVisible();
  });

  test("Ctrl+F focuses the search bar", async ({ page }) => {
    await freshStart(page);

    await page.getByTestId("noteflow-app").click();

    await page.keyboard.press("Control+f");

    await expect(page.getByTestId("search-input")).toBeFocused();
  });

  test("Escape clears search and blurs input", async ({ page }) => {
    await freshStart(page);

    const searchInput = page.getByTestId("search-input");
    await searchInput.click();
    await searchInput.fill("some query");

    await expect(searchInput).toHaveValue("some query");

    await page.keyboard.press("Escape");

    await expect(searchInput).toHaveValue("");
    await expect(searchInput).not.toBeFocused();
  });
});
