import { expect, test } from '@playwright/test';
import { newArticle, newUser, UI } from '../support/fixtures';

test.describe('Conduit Acceptance Requirements', () => {
  test('S12: Article list pagination shows different articles after changing page', async ({
    page,
  }) => {
    const user = await newUser();

    // Create enough articles to ensure the home feed has a second page.
    for (let index = 0; index < 11; index += 1) {
      await newArticle(user, {
        title: `Pagination article ${index}`,
        description: `Description for pagination article ${index}`,
        body: `Body for pagination article ${index}`,
      });
    }

    await page.goto(`${UI}/#/`);

    const articlePreviews = page.locator('app-article-preview');
    await expect(articlePreviews).toHaveCount(10);

    const firstPageTitles = await articlePreviews
      .locator('h1')
      .allTextContents();

    const pagination = page.locator('ul.pagination');
    await pagination.scrollIntoViewIfNeeded();

    const pageTwo = pagination.getByRole('link', { name: '2', exact: true });
    await expect(pageTwo).toBeVisible();
    await pageTwo.click();

    await expect(page).toHaveURL(/#\/\?page=2/);
    await expect(articlePreviews).toHaveCount(1);

    const secondPageTitles = await articlePreviews
      .locator('h1')
      .allTextContents();

    expect(secondPageTitles).not.toEqual(firstPageTitles);
  });
});