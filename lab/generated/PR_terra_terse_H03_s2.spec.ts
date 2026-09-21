import { expect, test } from '@playwright/test';
import { apiCall, loginAs, newArticle, newUser, UI } from '../support/fixtures';

test.describe('Conduit Acceptance Requirements', () => {
  test('@item:H03 Tag filter pagination', async ({ page, context }) => {
    const user = await newUser();
    const tag = `pagination-tag-${Date.now()}`;

    const articles = await Promise.all(
      Array.from({ length: 15 }, (_, index) =>
        newArticle(user, {
          title: `Tagged pagination article ${index + 1}`,
          description: `Description for tagged pagination article ${index + 1}`,
          body: `Body for tagged pagination article ${index + 1}`,
          tagList: [tag],
        }),
      ),
    );

    await loginAs(page, user);

    await page.goto(`${UI}/#/`);
    await expect(page.getByText(tag, { exact: true })).toBeVisible();

    await page.getByText(tag, { exact: true }).click();

    await expect(page).toHaveURL(new RegExp(`#/?\\?tag=${encodeURIComponent(tag)}|#/?tag=${encodeURIComponent(tag)}`));
    await expect(page.getByRole('link', { name: '2', exact: true })).toBeVisible();

    await page.getByRole('link', { name: '2', exact: true }).click();

    await expect(page).toHaveURL(
      new RegExp(`tag=${encodeURIComponent(tag)}.*page=2|page=2.*tag=${encodeURIComponent(tag)}`),
    );
    await expect(page.getByText(articles[10].title, { exact: true })).toBeVisible();
    await expect(page.getByText(articles[0].title, { exact: true })).not.toBeVisible();

    const directPage = await context.newPage();
    await directPage.goto(`${UI}/#/?tag=${encodeURIComponent(tag)}&page=2`);

    await expect(directPage.getByText(articles[10].title, { exact: true })).toBeVisible();
    await expect(directPage.getByText(articles[0].title, { exact: true })).not.toBeVisible();

    await page.getByRole('link', { name: 'Global Feed', exact: true }).click();

    await expect(page).toHaveURL(new RegExp(`${UI.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}/#/?$`));
    await expect(page.getByRole('link', { name: '1', exact: true })).toHaveClass(/active/);
    await expect(page.getByRole('link', { name: '2', exact: true })).toBeVisible();
  });
});