import { test, expect } from "@playwright/test";
import { freshStart } from "./helpers";

const selectAll = process.platform === "darwin" ? "Meta+a" : "Control+a";

async function createNoteAndType(
  page: import("@playwright/test").Page,
  text: string
) {
  await page.getByTestId("new-note-btn").click();
  const editor = page.getByTestId("editor-content").locator(".ProseMirror");
  await editor.click();
  await page.keyboard.type(text);
  await page.keyboard.press(selectAll);
}

test.describe("Rich Text Editing", () => {
  test("bold text via toolbar button", async ({ page }) => {
    await freshStart(page);
    await createNoteAndType(page, "bold text");

    await page
      .getByTestId("editor-toolbar")
      .getByRole("button", { name: "Bold" })
      .click();

    const editor = page.getByTestId("editor-content").locator(".ProseMirror");
    await expect(editor.locator("strong")).toContainText("bold text");
  });

  test("italic text via toolbar button", async ({ page }) => {
    await freshStart(page);
    await createNoteAndType(page, "italic text");

    await page
      .getByTestId("editor-toolbar")
      .getByRole("button", { name: "Italic" })
      .click();

    const editor = page.getByTestId("editor-content").locator(".ProseMirror");
    await expect(editor.locator("em")).toContainText("italic text");
  });

  test("heading 1 via toolbar button", async ({ page }) => {
    await freshStart(page);
    await createNoteAndType(page, "heading text");

    await page
      .getByTestId("editor-toolbar")
      .getByRole("button", { name: "Heading 1" })
      .click();

    const editor = page.getByTestId("editor-content").locator(".ProseMirror");
    await expect(editor.locator("h1")).toContainText("heading text");
  });

  test("bullet list via toolbar button", async ({ page }) => {
    await freshStart(page);
    await createNoteAndType(page, "list item");

    await page
      .getByTestId("editor-toolbar")
      .getByRole("button", { name: "Bullet List" })
      .click();

    const editor = page.getByTestId("editor-content").locator(".ProseMirror");
    await expect(editor.locator("ul")).toBeVisible();
    await expect(editor.locator("ul li")).toContainText("list item");
  });

  test("ordered list via toolbar button", async ({ page }) => {
    await freshStart(page);
    await createNoteAndType(page, "ordered item");

    await page
      .getByTestId("editor-toolbar")
      .getByRole("button", { name: "Ordered List" })
      .click();

    const editor = page.getByTestId("editor-content").locator(".ProseMirror");
    await expect(editor.locator("ol")).toBeVisible();
    await expect(editor.locator("ol li")).toContainText("ordered item");
  });

  test("task list with checkboxes", async ({ page }) => {
    await freshStart(page);

    // Create a note and toggle task list mode before typing
    await page.getByTestId("new-note-btn").click();
    const editor = page.getByTestId("editor-content").locator(".ProseMirror");
    await editor.click();

    await page
      .getByTestId("editor-toolbar")
      .getByRole("button", { name: "Task List" })
      .click();

    await page.keyboard.type("task item");

    await expect(editor.locator("ul[data-type='taskList']")).toBeVisible();
    await expect(
      editor.locator("ul[data-type='taskList']")
    ).toContainText("task item");
    // Verify checkbox exists
    await expect(
      editor.locator("ul[data-type='taskList'] input[type='checkbox']")
    ).toBeVisible();
  });

  test("code block via toolbar button", async ({ page }) => {
    await freshStart(page);
    await createNoteAndType(page, "const x = 1;");

    await page
      .getByTestId("editor-toolbar")
      .getByRole("button", { name: "Code Block" })
      .click();

    const editor = page.getByTestId("editor-content").locator(".ProseMirror");
    await expect(editor.locator("pre")).toBeVisible();
    await expect(editor.locator("pre code")).toContainText("const x = 1;");
  });

  test("blockquote via toolbar button", async ({ page }) => {
    await freshStart(page);
    await createNoteAndType(page, "quoted text");

    await page
      .getByTestId("editor-toolbar")
      .getByRole("button", { name: "Blockquote" })
      .click();

    const editor = page.getByTestId("editor-content").locator(".ProseMirror");
    await expect(editor.locator("blockquote")).toContainText("quoted text");
  });
});
