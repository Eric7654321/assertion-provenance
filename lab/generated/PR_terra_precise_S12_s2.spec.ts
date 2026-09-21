import { expect, test } from '@playwright/test';
import { newArticle, newUser, UI } from '../support/fixtures';

test.describe('Conduit Acceptance Criteria - Article list pagination', () => {
  test('S12: selecting page 2 shows the continuation of the article list', async ({
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

    await page.goto(`${UI}/#/`);

    const articlePreviews = page.locator('.article-preview');
    await expect(articlePreviews).toHaveCount(10);

    const firstPageTitles = await articlePreviews
      .locator('h1')
      .allTextContents();

    await page.locator('.pagination a', { hasText: '2' }).click();

    await expect(page.locator('.pagination .page-item.active')).toHaveText('2');
    await expect(articlePreviews).toHaveCount(2);

    const secondPageTitles = await articlePreviews
      .locator('h1')
      .allTextContents();

    expect(secondPageTitles).not.toEqual(firstPageTitles);
    expect(secondPageTitles).toEqual(
      expect.arrayContaining([
        articles[0].title,
        articles[1].title,
      ]),
    );
  });
});