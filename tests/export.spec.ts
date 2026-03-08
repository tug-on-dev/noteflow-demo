import { test, expect } from "@playwright/test";
import { freshStart } from "./helpers";

test.describe("Export functionality", () => {
  test("export as Markdown triggers a download", async ({ page }) => {
    await freshStart(page);

    // Create a note with content to export
    await page.getByTestId("new-note-btn").click();

    const titleInput = page.getByTestId("note-title-input");
    await titleInput.click();
    await titleInput.fill("Export Test");

    const editor = page.getByTestId("editor-content");
    await editor.click();
    await page.keyboard.type("Hello markdown world");

    await page.waitForTimeout(500);

    const downloadPromise = page.waitForEvent("download");

    await page
      .getByRole("button", { name: /Export as Markdown/i })
      .click();

    const download = await downloadPromise;
    expect(download.suggestedFilename()).toMatch(/\.md$/);
  });

  test("export as text triggers a download", async ({ page }) => {
    await freshStart(page);

    await page.getByTestId("new-note-btn").click();

    const titleInput = page.getByTestId("note-title-input");
    await titleInput.click();
    await titleInput.fill("Text Export Test");

    const editor = page.getByTestId("editor-content");
    await editor.click();
    await page.keyboard.type("Hello plain text world");

    await page.waitForTimeout(500);

    const downloadPromise = page.waitForEvent("download");

    await page
      .getByRole("button", { name: /Export as Text/i })
      .click();

    const download = await downloadPromise;
    expect(download.suggestedFilename()).toMatch(/\.txt$/);
  });
});
