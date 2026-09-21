import { expect, test } from '@playwright/test';
import { newArticle, newUser, UI } from '../support/fixtures';

test.describe('Conduit Acceptance Tests', () => {
  test('S12: Article list pagination displays different articles on page 2', async ({
    page,
  }) => {
    const user = await newUser();

    // Create enough articles to ensure pagination is available.
    for (let index = 0; index < 12; index += 1) {
      await newArticle(user, {
        title: `Pagination article ${index}`,
        description: `Description for pagination article ${index}`,
        body: `Body for pagination article ${index}`,
      });
    }

    await page.goto(`${UI}/#/`);

    const articlePreviews = page.locator('.article-preview');
    await expect(articlePreviews).toHaveCount(10);

    const firstPageTitles = await articlePreviews.locator('h1').allTextContents();

    const pageTwo = page.locator('.pagination a', { hasText: '2' });
    await expect(pageTwo).toBeVisible();

    await pageTwo.scrollIntoViewIfNeeded();
    await pageTwo.click();

    await expect(page).toHaveURL(/[#/]\/?\?offset=10/);
    await expect(articlePreviews).toHaveCount(2);

    const secondPageTitles = await articlePreviews.locator('h1').allTextContents();
    expect(secondPageTitles).not.toEqual(firstPageTitles);
  });
});