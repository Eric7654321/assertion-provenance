import { test, expect } from '@playwright/test';
import { newArticle, newUser, loginAs, UI } from '../support/fixtures';

test.describe('Conduit Acceptance Tests', () => {
  test('@item:S12 Article list pagination', async ({ page }) => {
    const user = await newUser();

    // Create enough articles to require a second page (Conduit displays 10 per page).
    const articles = [];
    for (let i = 0; i < 11; i++) {
      articles.push(
        await newArticle(user, {
          title: `Pagination article ${i + 1}`,
          description: `Description for pagination article ${i + 1}`,
          body: `Body for pagination article ${i + 1}`,
        }),
      );
    }

    await loginAs(page, user);
    await page.goto(`${UI}/#/`);

    const articleList = page.locator('.article-preview');
    await expect(articleList).toHaveCount(10);

    const firstPageTitles = await articleList.locator('h1').allTextContents();

    const pagination = page.locator('ul.pagination');
    await pagination.scrollIntoViewIfNeeded();

    await pagination.getByRole('link', { name: '2', exact: true }).click();

    await expect(page).toHaveURL(/#\/\?(?:.*&)?page=2(?:&.*)?$/);
    await expect(articleList).toHaveCount(1);

    const secondPageTitles = await articleList.locator('h1').allTextContents();

    expect(secondPageTitles).not.toEqual(firstPageTitles);
    expect(secondPageTitles).toContain(articles[0].title);
  });
});