import { test, expect, Page } from "@playwright/test";

// Helper to clear localStorage and reload for a fresh state
async function freshStart(page: Page) {
  await page.goto("/");
  await page.evaluate(() => localStorage.clear());
  await page.reload();
  await page.waitForSelector('[data-testid="noteflow-app"]');
}

// Helper to create a new notebook via the sidebar button.
async function createNotebook(page: Page) {
  await page.getByTestId("new-notebook-btn").click();
  await page.getByText("Untitled Notebook").first().waitFor();
}

export { freshStart, createNotebook };
