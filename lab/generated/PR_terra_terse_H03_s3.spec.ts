import { test, expect } from '@playwright/test';
import { newArticle, newUser, loginAs, UI } from '../support/fixtures';

test.describe('Conduit Acceptance Tests', () => {
  test('@item:H03 Pagination for tag filtering', async ({ page }) => {
    const user = await newUser();
    const tag = `pagination-tag-${Date.now()}`;

    const articles = await Promise.all(
      Array.from({ length: 15 }, (_, index) =>
        newArticle(user, {
          title: `Pagination article ${index + 1} ${Date.now()}`,
          description: `Description for pagination article ${index + 1}`,
          body: `Body for pagination article ${index + 1}`,
          tagList: [tag],
        }),
      ),
    );

    await loginAs(page, user);

    await page.goto(`${UI}/#/`);
    await expect(page).toHaveURL(/#\/$/);

    await page.getByRole('link', { name: tag, exact: true }).click();
    await expect(page).toHaveURL(new RegExp(`#/\\?tag=${encodeURIComponent(tag)}`));

    await expect(page.getByText(articles[0].title)).toBeVisible();
    await expect(page.getByText(articles[9].title)).toBeVisible();
    await expect(page.getByText(articles[10].title)).not.toBeVisible();

    const pageTwo = page.getByRole('link', { name: '2', exact: true });
    await expect(pageTwo).toBeVisible();
    await pageTwo.click();

    await expect(page).toHaveURL(
      new RegExp(`#/\\?tag=${encodeURIComponent(tag)}&page=2|#/\\?page=2&tag=${encodeURIComponent(tag)}`),
    );
    await expect(page.getByText(articles[10].title)).toBeVisible();
    await expect(page.getByText(articles[14].title)).toBeVisible();
    await expect(page.getByText(articles[0].title)).not.toBeVisible();

    await page.goto(`${UI}/#/article/${articles[0].slug}`);
    await expect(page.getByText(articles[0].title)).toBeVisible();

    await page.goto(`${UI}/#/?tag=${encodeURIComponent(tag)}&page=2`);
    await expect(page).toHaveURL(
      new RegExp(`#/\\?tag=${encodeURIComponent(tag)}&page=2`),
    );
    await expect(page.getByText(articles[10].title)).toBeVisible();
    await expect(page.getByText(articles[14].title)).toBeVisible();
    await expect(page.getByText(articles[0].title)).not.toBeVisible();

    await page.getByRole('link', { name: 'Global Feed', exact: true }).click();
    await expect(page).toHaveURL(/#\/$/);
    await expect(page.getByText(articles[0].title)).toBeVisible();
    await expect(page.getByText(articles[10].title)).toBeVisible();
  });
});