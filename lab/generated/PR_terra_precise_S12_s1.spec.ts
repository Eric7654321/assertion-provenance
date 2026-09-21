import { expect, test } from '@playwright/test';
import { newArticle, newUser, UI } from '../support/fixtures';

test.describe('Conduit Acceptance Tests', () => {
  test('@item:S12 Article list pagination', async ({ page }) => {
    const user = await newUser();

    // Create enough articles to ensure the home feed has a second page.
    for (let index = 0; index < 12; index += 1) {
      await newArticle(user, {
        title: `Pagination article ${index + 1}`,
        description: `Description for pagination article ${index + 1}`,
        body: `Body for pagination article ${index + 1}`,
      });
    }

    await page.goto(`${UI}/#/`);

    const articlePreviews = page.locator('app-article-list .article-preview');
    await expect(articlePreviews).toHaveCount(10);

    const firstPageTitles = await articlePreviews.locator('h1').allTextContents();

    const pagination = page.locator('nav[aria-label="Page navigation"]');
    await pagination.scrollIntoViewIfNeeded();

    const pageTwo = pagination.getByRole('link', { name: '2', exact: true });
    await expect(pageTwo).toBeVisible();
    await pageTwo.click();

    await expect(pageTwo).toHaveClass(/active/);
    await expect(articlePreviews).toHaveCount(2);

    const secondPageTitles = await articlePreviews.locator('h1').allTextContents();

    expect(secondPageTitles).toEqual([
      'Pagination article 2',
      'Pagination article 1',
    ]);
    expect(secondPageTitles).not.toEqual(firstPageTitles);
  });
});