import { expect, test } from '@playwright/test';
import { newArticle, newUser, loginAs, UI } from '../support/fixtures';

test.describe('Conduit Acceptance Tests', () => {
  test('@item:S12 Article list pagination', async ({ page }) => {
    const user = await newUser();

    // Create enough articles to ensure pagination is available.
    for (let index = 0; index < 12; index += 1) {
      await newArticle(user, {
        title: `Pagination article ${index + 1}`,
        description: `Description for pagination article ${index + 1}`,
        body: `Body for pagination article ${index + 1}`,
      });
    }

    await loginAs(page, user);
    await page.goto(`${UI}/#/`);

    const pagination = page.locator('nav[aria-label="Pagination"], .pagination').first();
    await expect(pagination).toBeVisible();

    const pageTwo = pagination.getByRole('link', { name: '2', exact: true });
    await expect(pageTwo).toBeVisible();
    await pageTwo.scrollIntoViewIfNeeded();
    await pageTwo.click();

    await expect(page).toHaveURL(/[#?&]page=2|offset=10/);

    const articlePreviews = page.locator('.article-preview');
    await expect(articlePreviews).toHaveCount(2);
    await expect(articlePreviews.first()).toContainText('Pagination article 2');
  });
});