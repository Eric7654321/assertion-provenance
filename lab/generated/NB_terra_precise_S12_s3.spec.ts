import { test, expect } from '@playwright/test';
import { newArticle, newUser, loginAs, UI } from '../support/fixtures';

test.describe('Conduit Acceptance Tests', () => {
  test('@item:S12 Article list pagination', async ({ page }) => {
    const user = await newUser();

    // Create enough articles to ensure pagination has a second page.
    for (let i = 0; i < 11; i++) {
      await newArticle(user, {
        title: `Pagination article ${i + 1}`,
        description: `Description for pagination article ${i + 1}`,
        body: `Body for pagination article ${i + 1}`,
      });
    }

    await loginAs(page, user);
    await page.goto(`${UI}/#/`);

    const articlePreviews = page.locator('app-article-list .article-preview');
    await expect(articlePreviews).toHaveCount(10);

    const pagination = page.locator('nav[aria-label="Page navigation"]');
    await pagination.scrollIntoViewIfNeeded();

    const pageTwo = pagination.getByRole('link', { name: '2', exact: true });
    await expect(pageTwo).toBeVisible();
    await pageTwo.click();

    await expect(pageTwo).toHaveClass(/active/);
    await expect(articlePreviews).toHaveCount(1);
    await expect(articlePreviews).toContainText('Pagination article 1');
  });
});