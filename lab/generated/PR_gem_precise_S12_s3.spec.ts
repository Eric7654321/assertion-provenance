import { test, expect } from '@playwright/test';
import { UI } from '../support/fixtures';

test.describe('Conduit Acceptance Tests', () => {
  test('Article list pagination (@item:S12)', async ({ page }) => {
    // Given a user views the article list on the home page and scrolls to the pagination controls
    await page.goto(`${UI}/#/`);

    // Ensure articles are loaded on page 1
    const pagination = page.getByRole('navigation', { name: 'Pagination' });
    await expect(pagination).toBeVisible();

    const page1Button = page.getByRole('button', { name: 'Page 1 is your current page' });
    await expect(page1Button).toBeVisible();

    // Capture the first article title on page 1
    const firstArticleOnPage1 = await page.locator('.article-preview h1').first().innerText();

    // When the user selects page 2
    const page2Button = page.getByRole('button', { name: 'Page 2' });
    await page2Button.scrollIntoViewIfNeeded();
    await page2Button.click();

    // Then the subsequent articles are displayed
    const page2CurrentButton = page.getByRole('button', { name: 'Page 2 is your current page' });
    await expect(page2CurrentButton).toBeVisible();

    // Verify articles updated on page 2
    await expect(page.locator('.article-preview h1').first()).not.toHaveText(firstArticleOnPage1);
  });
});