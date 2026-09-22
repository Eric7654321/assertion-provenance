import { test, expect } from '@playwright/test';
import { newUser, newArticle, loginAs, UI } from '../support/fixtures';

test.describe('Conduit Acceptance Tests', () => {
  test('@item:H03 Pagination under tag filter', async ({ page }) => {
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

    await loginAs(page, user);

    await page.goto(`${UI}/#/`);
    await page.getByRole('link', { name: tag, exact: true }).click();

    const articlePreviews = page.locator('app-article-list .article-preview');
    await expect(articlePreviews).toHaveCount(10);

    await page.getByRole('link', { name: '2', exact: true }).click();

    await expect(articlePreviews).toHaveCount(5);
    await expect(page).toHaveURL(new RegExp(`tag=${encodeURIComponent(tag)}.*page=2|page=2.*tag=${encodeURIComponent(tag)}`));

    const secondPageTitles = await articlePreviews.locator('h1').allTextContents();
    const expectedSecondPageTitles = articles
      .slice(10)
      .reverse()
      .map((article) => article.title);

    expect(secondPageTitles).toEqual(expectedSecondPageTitles);

    await page.goto(`${UI}/#/?tag=${encodeURIComponent(tag)}&page=2`);

    await expect(articlePreviews).toHaveCount(5);
    await expect(articlePreviews.locator('h1').allTextContents()).resolves.toEqual(
      expectedSecondPageTitles,
    );

    await page.getByRole('link', { name: 'Global Feed', exact: true }).click();

    await expect(articlePreviews).toHaveCount(10);
    await expect(page).not.toHaveURL(/page=2/);
  });
});