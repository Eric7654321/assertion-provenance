import { test, expect } from '@playwright/test';
import { newArticle, newUser, loginAs, UI } from '../support/fixtures';

test.describe('Conduit Acceptance Criteria', () => {
  test('S12: Article list pagination shows the continuation of the list', async ({
    page,
  }) => {
    const user = await newUser();

    const articles = [];
    for (let index = 0; index < 12; index += 1) {
      articles.push(
        await newArticle(user, {
          title: `Pagination article ${index + 1}`,
          description: `Description for pagination article ${index + 1}`,
          body: `Body for pagination article ${index + 1}`,
        }),
      );
    }

    await loginAs(page, user);
    await page.goto(`${UI}/#/`);

    const articlePreviews = page.locator('app-article-list .article-preview');
    await expect(articlePreviews).toHaveCount(10);

    const firstPageTitles = await articlePreviews.locator('h1').allTextContents();

    const pagination = page.locator('ul.pagination');
    await pagination.scrollIntoViewIfNeeded();

    const pageTwo = pagination.getByRole('link', { name: '2', exact: true });
    await expect(pageTwo).toBeVisible();
    await pageTwo.click();

    await expect(page).toHaveURL(/#\/\?page=2/);
    await expect(articlePreviews).toHaveCount(2);

    const secondPageTitles = await articlePreviews.locator('h1').allTextContents();

    expect(secondPageTitles).not.toEqual(firstPageTitles);
    expect(secondPageTitles).toEqual(
      expect.arrayContaining([
        articles[0].title,
        articles[1].title,
      ]),
    );
  });
});