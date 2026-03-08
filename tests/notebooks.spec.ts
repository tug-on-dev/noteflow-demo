import { test, expect } from "@playwright/test";
import { freshStart, createNotebook } from "./helpers";

test.describe("Notebook CRUD", () => {
  test("create a new notebook", async ({ page }) => {
    await freshStart(page);

    const sidebar = page.getByTestId("sidebar");

    // Notebooks section is expanded by default — create via keyboard shortcut
    await createNotebook(page);

    // New notebook appears with default name "Untitled Notebook"
    await expect(sidebar.getByText("Untitled Notebook")).toBeVisible();
  });

  test("rename a notebook via double-click", async ({ page }) => {
    await freshStart(page);

    const sidebar = page.getByTestId("sidebar");

    // Notebooks section is already expanded — double-click the notebook name
    await sidebar.getByText("Getting Started").dblclick();

    // An inline input should appear; clear it and type the new name
    const renameInput = sidebar.getByRole("textbox");
    await renameInput.fill("My Notebook");
    await renameInput.press("Enter");

    // Verify the new name is visible and old name is gone
    await expect(sidebar.getByText("My Notebook")).toBeVisible();
    await expect(sidebar.getByText("Getting Started")).not.toBeVisible();
  });

  test("delete a notebook via context menu", async ({ page }) => {
    await freshStart(page);

    const sidebar = page.getByTestId("sidebar");

    // Accept the confirm dialog before triggering it
    page.on("dialog", (dialog) => dialog.accept());

    // Hover to reveal the "..." button, then click it
    const notebookItem = sidebar
      .locator('[data-testid^="notebook-item-"]')
      .first();
    await notebookItem.hover();

    // Click the "..." (more) span which opens the context menu
    await notebookItem.locator("span").filter({ has: page.locator("svg") }).last().click();

    // Click Delete in the context menu (the fixed popover inside sidebar)
    await sidebar.locator(".fixed").getByRole("button", { name: /Delete/ }).click();

    // Notebook should no longer be in the sidebar notebooks section
    await expect(
      sidebar.locator('[data-testid^="notebook-item-"]')
    ).toHaveCount(0);
  });

  test("note count badge shows correct count", async ({ page }) => {
    await freshStart(page);

    const sidebar = page.getByTestId("sidebar");

    // Notebooks section is already expanded
    const notebookItem = sidebar
      .locator('[data-testid^="notebook-item-"]')
      .first();
    await expect(notebookItem).toContainText("3");
  });

  test('"All Notes" view shows notes from all notebooks', async ({ page }) => {
    await freshStart(page);

    // Create a second notebook via keyboard shortcut
    await createNotebook(page);

    // Create a note in the new notebook
    await page.getByTestId("new-note-btn").click();
    await expect(page.getByTestId("note-editor")).toBeVisible();

    // Switch to "All Notes" view
    await page.getByTestId("all-notes-btn").click();

    // Should see all 4 notes (3 sample + 1 new)
    const notesList = page.getByTestId("notes-list");
    await expect(
      notesList.locator('[data-testid^="note-item-"]')
    ).toHaveCount(4);
  });

  test("creating a note in a specific notebook increases its count", async ({
    page,
  }) => {
    await freshStart(page);

    const sidebar = page.getByTestId("sidebar");

    // Notebooks section is already expanded — verify initial count is 3
    const notebookItem = sidebar
      .locator('[data-testid^="notebook-item-"]')
      .first();
    await expect(notebookItem).toContainText("3");

    // Select the notebook then create a new note inside it
    await notebookItem.click();
    await page.getByTestId("new-note-btn").click();
    await expect(page.getByTestId("note-editor")).toBeVisible();

    // Count should now be 4
    await expect(notebookItem).toContainText("4");
  });
});
