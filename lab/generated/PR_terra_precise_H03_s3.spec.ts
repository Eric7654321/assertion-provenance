import { expect, test } from '@playwright/test';
import { newArticle, newUser, UI } from '../support/fixtures';

test.describe('Conduit Acceptance Tests', () => {
  test('@item:H03 Pagination with tag filter', async ({ page }) => {
    const user = await newUser();
    const tag = `pagination-tag-${Date.now()}`;

    const articles = await Promise.all(
      Array.from({ length: 15 }, (_, index) =>
        newArticle(user, {
          title: `Pagination article ${index + 1}`,
          description: `Description for pagination article ${index + 1}`,
          body: `Body for pagination article ${index + 1}`,
          tagList: [tag],
        }),
      ),
    );

    await page.goto(`${UI}/#/`);

    const tagLink = page.getByRole('link', { name: tag, exact: true });
    await expect(tagLink).toBeVisible();
    await tagLink.click();

    const articlePreviews = page.locator('.article-preview');
    await expect(articlePreviews).toHaveCount(10);

    await expect(page).toHaveURL(new RegExp(`#/\\?tag=${encodeURIComponent(tag)}`));

    const firstPageTitles = await articlePreviews
      .locator('h1')
      .allTextContents();

    await page.getByRole('link', { name: '2', exact: true }).click();

    await expect(articlePreviews).toHaveCount(5);
    await expect(page).toHaveURL(
      new RegExp(`#/\\?tag=${encodeURIComponent(tag)}&page=2`),
    );

    const secondPageTitles = await articlePreviews
      .locator('h1')
      .allTextContents();

    expect(secondPageTitles).not.toEqual(firstPageTitles);
    expect(secondPageTitles).toEqual(
      expect.arrayContaining(
        articles.slice(0, 5).map((article) => article.title),
      ),
    );

    await page.goto(`${UI}/#/?tag=${encodeURIComponent(tag)}&page=2`);

    await expect(articlePreviews).toHaveCount(5);
    await expect(page).toHaveURL(
      new RegExp(`#/\\?tag=${encodeURIComponent(tag)}&page=2`),
    );
    await expect(articlePreviews.locator('h1').allTextContents()).resolves.toEqual(
      secondPageTitles,
    );

    await page.getByRole('link', { name: 'Global Feed', exact: true }).click();

    await expect(articlePreviews).toHaveCount(10);
    await expect(page).toHaveURL(new RegExp(`${UI.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}/#/$`));
  });
});