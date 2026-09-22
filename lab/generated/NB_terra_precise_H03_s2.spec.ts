import { test, expect } from '@playwright/test';
import {
  newUser,
  newArticle,
  loginAs,
  UI,
} from '../support/fixtures';

test.describe('Conduit Acceptance Criteria', () => {
  test('H03 - Tag-filtered pagination', async ({ page, context }) => {
    const user = await newUser();
    const tag = `pagination-tag-${Date.now()}`;

    const articles = await Promise.all(
      Array.from({ length: 15 }, (_, index) =>
        newArticle(user, {
          title: `Pagination article ${index + 1} ${Date.now()}`,
          tagList: [tag],
        }),
      ),
    );

    await loginAs(page, user);
    await page.goto(`${UI}/#/`);

    await page.getByRole('link', { name: tag, exact: true }).click();

    const articlePreviews = page.locator('.article-preview');
    await expect(articlePreviews).toHaveCount(10);

    const firstPageTitles = await articlePreviews
      .locator('h1')
      .allTextContents();

    await page.getByRole('link', { name: '2', exact: true }).click();

    await expect(page).toHaveURL(/[#?&]page=2/);
    await expect(articlePreviews).toHaveCount(5);

    const secondPageTitles = await articlePreviews
      .locator('h1')
      .allTextContents();

    expect(secondPageTitles).not.toEqual(firstPageTitles);
    expect(secondPageTitles).toEqual(
      articles.slice(10).map((article) => article.title),
    );

    const pageTwoUrl = page.url();
    const directPage = await context.newPage();

    await directPage.goto(pageTwoUrl);

    await expect(directPage).toHaveURL(/[#?&]page=2/);
    await expect(directPage.locator('.article-preview')).toHaveCount(5);
    await expect(
      directPage.locator('.article-preview').locator('h1'),
    ).toHaveText(secondPageTitles);

    await page.getByRole('link', { name: 'Global Feed', exact: true }).click();

    await expect(page).not.toHaveURL(/[#?&]page=2/);
    await expect(articlePreviews).toHaveCount(10);

    await directPage.close();
  });
});