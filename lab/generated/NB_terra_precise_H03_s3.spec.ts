import { test, expect } from '@playwright/test';
import { newUser, newArticle, loginAs, UI } from '../support/fixtures';

test.describe('Conduit Acceptance Tests', () => {
  test('@item:H03 Pagination with tag filter', async ({ page }) => {
    const user = await newUser();
    const tag = `pagination-tag-${Date.now()}`;

    const articles = await Promise.all(
      Array.from({ length: 15 }, (_, index) =>
        newArticle(user, {
          title: `Pagination article ${index + 1}`,
          description: `Description ${index + 1}`,
          body: `Body ${index + 1}`,
          tagList: [tag],
        }),
      ),
    );

    await loginAs(page, user);
    await page.goto(`${UI}/#/`);

    await page.getByRole('link', { name: tag }).click();

    const articlePreviews = page.locator('.article-preview');
    await expect(articlePreviews).toHaveCount(10);

    await page.getByRole('link', { name: '2', exact: true }).click();

    await expect(articlePreviews).toHaveCount(5);
    await expect(page).toHaveURL(new RegExp(`/#/\\?tag=${tag}&page=2|/#/\\?page=2&tag=${tag}`));

    const secondPageTitles = await articlePreviews.locator('h1').allTextContents();
    expect(secondPageTitles).toEqual(
      expect.arrayContaining(articles.slice(10).map((article) => article.title)),
    );

    await page.goto(`${UI}/#/?tag=${encodeURIComponent(tag)}&page=2`);

    await expect(articlePreviews).toHaveCount(5);
    await expect(articlePreviews.locator('h1')).toHaveText(
      expect.arrayContaining(articles.slice(10).map((article) => article.title)),
    );

    await page.getByRole('link', { name: 'Global Feed' }).click();

    await expect(articlePreviews).toHaveCount(10);
    await expect(page).toHaveURL(`${UI}/#/`);
  });
});