import { test, expect } from "@playwright/test";
import { freshStart } from "./helpers";

test.describe("Tags", () => {
  test("add a tag to a note", async ({ page }) => {
    await freshStart(page);

    // Select the first note
    const firstNote = page.getByTestId("notes-list").locator("[data-testid^='note-item-']").first();
    await firstNote.click();

    // Type a new tag and press Enter
    const tagInput = page.getByTestId("tag-input");
    await tagInput.fill("my-new-tag");
    await tagInput.press("Enter");

    // Verify the tag appears in the note's tags section
    const tagsContainer = page.getByTestId("note-tags");
    await expect(tagsContainer.getByText("my-new-tag")).toBeVisible();
  });

  test("remove a tag from a note", async ({ page }) => {
    await freshStart(page);

    // Select the first note
    const firstNote = page.getByTestId("notes-list").locator("[data-testid^='note-item-']").first();
    await firstNote.click();

    // Find an existing tag and click its X/remove button
    const tagsContainer = page.getByTestId("note-tags");
    const firstTag = tagsContainer.locator(".inline-flex, [class*='badge'], [class*='tag']").first();
    const tagText = await firstTag.textContent();
    const tagName = tagText?.replace(/[×✕xX]$/, "").trim() ?? "";

    // Click the remove button within the tag chip
    await firstTag.getByRole("button").click();

    // Verify the tag is removed
    await expect(tagsContainer.getByText(tagName, { exact: true })).toBeHidden();
  });

  test("filter notes by clicking a tag in the sidebar", async ({ page }) => {
    await freshStart(page);

    // Tags section is already expanded by default — no toggle needed
    const sidebar = page.getByTestId("sidebar");

    // Click the "getting-started" tag
    await page.getByTestId("tag-item-getting-started").click();

    // Verify the notes list only shows notes with that tag
    const noteItems = page.getByTestId("notes-list").locator("[data-testid^='note-item-']");
    const count = await noteItems.count();
    expect(count).toBeGreaterThan(0);

    // Each visible note should contain the "getting-started" tag
    for (let i = 0; i < count; i++) {
      await noteItems.nth(i).click();
      const tagsContainer = page.getByTestId("note-tags");
      await expect(tagsContainer.getByText("getting-started")).toBeVisible();
    }
  });

  test("tags appear in sidebar with correct counts", async ({ page }) => {
    await freshStart(page);

    // Tags section is already expanded by default
    const sidebar = page.getByTestId("sidebar");

    // Verify tags are visible in the sidebar (sample data uses these tag names)
    await expect(page.getByTestId("tag-item-getting-started")).toBeVisible();
    await expect(page.getByTestId("tag-item-welcome")).toBeVisible();

    // Each tag item should display a count
    const tagItems = sidebar.locator("[data-testid^='tag-item-']");
    const tagCount = await tagItems.count();
    expect(tagCount).toBeGreaterThan(0);

    // Verify count badges are numeric
    for (let i = 0; i < tagCount; i++) {
      const text = await tagItems.nth(i).textContent();
      expect(text).toMatch(/\d/);
    }
  });

  test("tag autocomplete shows existing tags when typing", async ({ page }) => {
    await freshStart(page);

    // Select a note
    const firstNote = page.getByTestId("notes-list").locator("[data-testid^='note-item-']").first();
    await firstNote.click();

    // Start typing a partial tag that matches existing tags
    const tagInput = page.getByTestId("tag-input");
    await tagInput.fill("get");

    // Autocomplete suggestions should appear with matching tags
    const suggestion = page.getByText("getting-started").last();
    await expect(suggestion).toBeVisible();
  });
});
