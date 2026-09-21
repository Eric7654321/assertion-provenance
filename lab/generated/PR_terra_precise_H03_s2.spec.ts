import { test, expect } from '@playwright/test';
import {
  newUser,
  newArticle,
  loginAs,
  UI,
} from '../support/fixtures';

test.describe('Conduit Acceptance Criteria', () => {
  test('@item:H03 Tag-filtered pagination', async ({ page, context }) => {
    const user = await newUser();
    const tag = `pagination-tag-${Date.now()}`;

    for (let index = 0; index < 15; index += 1) {
      await newArticle(user, {
        title: `Tagged pagination article ${index + 1}`,
        description: `Description for tagged pagination article ${index + 1}`,
        body: `Body for tagged pagination article ${index + 1}`,
        tagList: [tag],
      });
    }

    await loginAs(page, user);
    await page.goto(`${UI}/#/`);

    const tagLink = page.getByRole('link', { name: tag, exact: true }).first();
    await expect(tagLink).toBeVisible();
    await tagLink.click();

    await expect(page).toHaveURL(new RegExp(`#/\\?tag=${encodeURIComponent(tag)}`));

    const articlePreviews = page.locator('.article-preview');
    await expect(articlePreviews).toHaveCount(10);

    const firstPageTitles = await articlePreviews
      .locator('h1')
      .allTextContents();

    const page2Link = page.getByRole('link', { name: '2', exact: true });
    await expect(page2Link).toBeVisible();
    await page2Link.click();

    await expect(page).toHaveURL(
      new RegExp(`#/\\?tag=${encodeURIComponent(tag)}&page=2`),
    );
    await expect(articlePreviews).toHaveCount(5);

    const secondPageTitles = await articlePreviews
      .locator('h1')
      .allTextContents();

    expect(secondPageTitles).not.toEqual(firstPageTitles);
    expect(secondPageTitles).toHaveLength(5);

    const directPage = await context.newPage();
    await directPage.goto(`${UI}/#/?tag=${encodeURIComponent(tag)}&page=2`);

    await expect(directPage).toHaveURL(
      new RegExp(`#/\\?tag=${encodeURIComponent(tag)}&page=2`),
    );
    await expect(directPage.locator('.article-preview')).toHaveCount(5);
    await expect(directPage.locator('.article-preview h1')).toHaveText(
      secondPageTitles,
    );

    await page.getByRole('link', { name: 'Global Feed', exact: true }).click();

    await expect(page).toHaveURL(new RegExp('#/$'));
    await expect(articlePreviews).toHaveCount(10);
    await expect(page.getByRole('link', { name: '1', exact: true })).toHaveClass(
      /active/,
    );

    await directPage.close();
  });
});