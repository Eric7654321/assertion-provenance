import { test, expect } from '@playwright/test';
import { UI } from '../support/fixtures';

test.describe('Conduit Acceptance Requirements', () => {
  test('@item:S12 Article list pagination', async ({ page }) => {
    // Given the user scrolls to the pagination bar on the home page article list
    await page.goto(`${UI}/#/`);

    const articleHeadings = page.locator('.article-preview h1');
    await expect(articleHeadings.first()).toBeVisible();

    const page1Articles = await articleHeadings.allInnerTexts();
    expect(page1Articles.length).toBeGreaterThan(0);

    const page2Button = page.getByRole('button', { name: 'Page 2' });
    await page2Button.scrollIntoViewIfNeeded();
    await expect(page2Button).toBeVisible();

    // When the user clicks page 2
    await page2Button.click();

    // Then different articles should be displayed after changing pages
    await expect(page.getByRole('button', { name: 'Page 2 is your current page' })).toBeVisible();

    const page2Articles = await articleHeadings.allInnerTexts();
    expect(page2Articles.length).toBeGreaterThan(0);
    expect(page2Articles).not.toEqual(page1Articles);
  });
});