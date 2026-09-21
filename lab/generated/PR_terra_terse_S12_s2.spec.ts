import { expect, test } from '@playwright/test';
import { newArticle, newUser, loginAs, UI } from '../support/fixtures';

test.describe('Conduit Acceptance Requirements', () => {
  test('@item:S12 Article list pagination', async ({ page }) => {
    const user = await newUser();

    for (let index = 1; index <= 12; index += 1) {
      await newArticle(user, {
        title: `Pagination article ${index}`,
        description: `Description for pagination article ${index}`,
        body: `Body for pagination article ${index}`,
      });
    }

    await loginAs(page, user);
    await page.goto(`${UI}/#/`);

    const articlePreviews = page.locator('app-article-list app-article-preview');
    await expect(articlePreviews.first()).toBeVisible();

    const firstPageArticleTitle = await articlePreviews.first().locator('h1').textContent();

    const pagination = page.locator('ul.pagination');
    await pagination.scrollIntoViewIfNeeded();

    const pageTwo = pagination.getByRole('link', { name: '2', exact: true });
    await expect(pageTwo).toBeVisible();
    await pageTwo.click();

    await expect(pageTwo).toHaveClass(/active/);
    await expect(articlePreviews.first().locator('h1')).not.toHaveText(
      firstPageArticleTitle ?? '',
    );
  });
});