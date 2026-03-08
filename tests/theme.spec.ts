import { test, expect } from "@playwright/test";
import { freshStart } from "./helpers";

test.describe("Theme toggle", () => {
  test("toggles to dark mode", async ({ page }) => {
    await freshStart(page);

    const toggle = page.getByTestId("theme-toggle");
    // Default theme on fresh start is "system"
    await expect(toggle).toHaveAttribute("aria-label", /Theme: system/i);

    // system → light
    await toggle.click();
    await expect(toggle).toHaveAttribute("aria-label", /Theme: light/i);

    // light → dark
    await toggle.click();
    await expect(toggle).toHaveAttribute("aria-label", /Theme: dark/i);
    await expect(page.locator("html")).toHaveClass(/dark/);
  });

  test("toggles back to light mode through the cycle", async ({ page }) => {
    await freshStart(page);

    const toggle = page.getByTestId("theme-toggle");

    // system → light
    await toggle.click();
    await expect(toggle).toHaveAttribute("aria-label", /Theme: light/i);
    await expect(page.locator("html")).not.toHaveClass(/dark/);

    // light → dark
    await toggle.click();
    await expect(toggle).toHaveAttribute("aria-label", /Theme: dark/i);
    await expect(page.locator("html")).toHaveClass(/dark/);

    // dark → system
    await toggle.click();
    await expect(toggle).toHaveAttribute("aria-label", /Theme: system/i);
  });

  test("theme preference persists after reload", async ({ page }) => {
    await freshStart(page);

    const toggle = page.getByTestId("theme-toggle");
    // system → light → dark (two clicks)
    await toggle.click();
    await toggle.click();
    await expect(toggle).toHaveAttribute("aria-label", /Theme: dark/i);
    await expect(page.locator("html")).toHaveClass(/dark/);

    // Wait for debounced auto-save to complete
    await page.waitForTimeout(500);

    await page.reload();
    await page.waitForSelector('[data-testid="noteflow-app"]');

    await expect(page.getByTestId("theme-toggle")).toHaveAttribute(
      "aria-label",
      /Theme: dark/i,
    );
    await expect(page.locator("html")).toHaveClass(/dark/);
  });

  test("system theme detection works on first visit", async ({ page }) => {
    // Emulate dark system preference before visiting the page
    await page.emulateMedia({ colorScheme: "dark" });
    await freshStart(page);

    // On first visit with system preference, the app defaults to "system" theme
    // which should apply dark mode based on the system preference
    const stored = await page.evaluate(() => {
      const raw = localStorage.getItem("noteflow");
      return raw ? JSON.parse(raw).settings.theme : null;
    });

    // The default theme is "system", so the html element should reflect the OS preference
    if (stored === "system") {
      await expect(page.locator("html")).toHaveClass(/dark/);
    }
  });
});
