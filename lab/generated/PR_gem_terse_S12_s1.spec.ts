import { test, expect } from '@playwright/test';
import { UI } from '../support/fixtures';

test.describe('Article list pagination', () => {
  test('should see different articles after changing the page', async ({ page }) => {
    await page.goto(`${UI}/#/`);

    // Wait for the articles to load on page 1
    const articleHeadings = page.locator('.article-preview h1');
    await expect(articleHeadings.first()).toBeVisible();
    const pageOneTitles = await articleHeadings.allTextContents();

    // Scroll to the pagination bar and click page 2
    const page2Button = page.getByRole('button', { name: 'Page 2' });
    await page2Button.scrollIntoViewIfNeeded();
    await page2Button.click();

    // Wait for page 2 to become the current page
    await expect(page.getByRole('button', { name: 'Page 2 is your current page' })).toBeVisible();

    // Verify articles are loaded and are different from page 1
    await expect(articleHeadings.first()).toBeVisible();
    const pageTwoTitles = await articleHeadings.allTextContents();

    expect(pageTwoTitles).not.toEqual(pageOneTitles);
  });
});