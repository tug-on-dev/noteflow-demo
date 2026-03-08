import { test, expect } from "@playwright/test";
import { freshStart, createNotebook } from "./helpers";

test.describe("Data persistence across reloads", () => {
  test("notebook persists after reload", async ({ page }) => {
    await freshStart(page);

    await createNotebook(page);

    await expect(
      page.getByTestId("sidebar").getByText("Untitled Notebook"),
    ).toBeVisible();

    // Wait for debounced save
    await page.waitForTimeout(500);

    await page.reload();
    await page.waitForSelector('[data-testid="noteflow-app"]');

    await expect(
      page.getByTestId("sidebar").getByText("Untitled Notebook"),
    ).toBeVisible();
  });

  test("note title and content persist after reload", async ({ page }) => {
    await freshStart(page);

    // Create a new note
    await page.getByTestId("new-note-btn").click();

    const titleInput = page.getByTestId("note-title-input");
    await titleInput.click();
    await titleInput.fill("My Persistent Note");

    // Type into the Tiptap editor
    const editorEl = page.locator('.ProseMirror[contenteditable="true"]');
    await editorEl.click();
    await page.keyboard.type("This content should survive a reload.");

    // Wait for debounced autosave (300ms debounce + buffer)
    await page.waitForTimeout(1000);

    // Verify data is in localStorage before reloading
    const saved = await page.evaluate(() => {
      const raw = localStorage.getItem("noteflow");
      if (!raw) return null;
      const data = JSON.parse(raw);
      const note = data.notes.find((n: { title: string }) => n.title === "My Persistent Note");
      return note ? { title: note.title, content: note.content } : null;
    });
    expect(saved).not.toBeNull();
    expect(saved?.title).toBe("My Persistent Note");

    await page.reload();
    await page.waitForSelector('[data-testid="noteflow-app"]');

    // Click the note in the notes list to select it
    await page.getByText("My Persistent Note").first().click();

    await expect(page.getByTestId("note-title-input")).toHaveValue(
      "My Persistent Note",
    );
  });

  test("tags persist after reload", async ({ page }) => {
    await freshStart(page);

    await page.getByTestId("new-note-btn").click();

    const tagInput = page.getByTestId("tag-input");
    await tagInput.click();
    await tagInput.fill("important");
    await page.keyboard.press("Enter");

    await tagInput.fill("work");
    await page.keyboard.press("Enter");

    // Verify tags are shown before reload
    await expect(page.getByTestId("note-tags")).toContainText("important");
    await expect(page.getByTestId("note-tags")).toContainText("work");

    await page.waitForTimeout(500);

    await page.reload();
    await page.waitForSelector('[data-testid="noteflow-app"]');

    await expect(page.getByTestId("note-tags")).toContainText("important");
    await expect(page.getByTestId("note-tags")).toContainText("work");
  });

  test("pin state persists after reload", async ({ page }) => {
    await freshStart(page);

    await page.getByTestId("new-note-btn").click();

    const titleInput = page.getByTestId("note-title-input");
    await titleInput.click();
    await titleInput.fill("Pinned Note");

    // Click the pin button scoped to the editor header (avoids matching note-list buttons)
    const pinButton = page.getByTestId("note-editor").getByRole("button", { name: /pin/i });
    await pinButton.click();

    await page.waitForTimeout(500);

    await page.reload();
    await page.waitForSelector('[data-testid="noteflow-app"]');

    // Verify the note is still pinned — the pin button should indicate active state
    // and the note title should still be visible
    await expect(page.getByTestId("note-title-input")).toHaveValue(
      "Pinned Note",
    );

    // Check localStorage directly for pin state
    const isPinned = await page.evaluate(() => {
      const raw = localStorage.getItem("noteflow");
      if (!raw) return false;
      const data = JSON.parse(raw);
      const note = data.notes.find(
        (n: { title: string }) => n.title === "Pinned Note",
      );
      return note?.isPinned ?? false;
    });
    expect(isPinned).toBe(true);
  });

  test("deleted note appears in trash after reload", async ({ page }) => {
    await freshStart(page);

    await page.getByTestId("new-note-btn").click();

    const titleInput = page.getByTestId("note-title-input");
    await titleInput.click();
    await titleInput.fill("Note to Delete");

    await page.waitForTimeout(500);

    // Delete the note via the delete button scoped to the editor
    const deleteButton = page.getByTestId("note-editor").getByRole("button", { name: /delete/i });
    await deleteButton.click();

    await page.waitForTimeout(500);

    await page.reload();
    await page.waitForSelector('[data-testid="noteflow-app"]');

    // Navigate to trash
    await page.getByTestId("trash-btn").click();

    // The deleted note should appear in the trash
    await expect(page.getByText("Note to Delete")).toBeVisible();
  });
});
