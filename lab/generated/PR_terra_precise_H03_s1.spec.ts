import { expect, test } from '@playwright/test';
import {
  apiCall,
  loginAs,
  newArticle,
  newUser,
  UI,
} from '../support/fixtures';

test('H03: pagination under tag filter', async ({ page }) => {
  const user = await newUser();
  const tag = `pagination-tag-${Date.now()}`;

  for (let index = 0; index < 15; index += 1) {
    await newArticle(user, {
      title: `Pagination article ${index + 1}`,
      description: `Article ${index + 1} for pagination testing`,
      body: `Body for pagination article ${index + 1}`,
      tagList: [tag],
    });
  }

  await loginAs(page, user);
  await page.goto(`${UI}/#/`);

  const tagLink = page.getByRole('link', { name: tag, exact: true });
  await expect(tagLink).toBeVisible();
  await tagLink.click();

  const articlePreviews = page.locator('.article-preview');
  await expect(articlePreviews).toHaveCount(10);

  const firstPageTitles = await articlePreviews.locator('h1').allTextContents();

  const page2Link = page.getByRole('link', { name: '2', exact: true });
  await expect(page2Link).toBeVisible();
  await page2Link.click();

  await expect(page).toHaveURL(new RegExp(`tag=${encodeURIComponent(tag)}.*page=2|page=2.*tag=${encodeURIComponent(tag)}`));
  await expect(articlePreviews).toHaveCount(5);

  const secondPageTitles = await articlePreviews.locator('h1').allTextContents();
  expect(secondPageTitles).toEqual([
    'Pagination article 5',
    'Pagination article 4',
    'Pagination article 3',
    'Pagination article 2',
    'Pagination article 1',
  ]);
  expect(secondPageTitles).not.toEqual(firstPageTitles);

  await page.goto(`${UI}/#/?tag=${encodeURIComponent(tag)}&page=2`);

  await expect(page).toHaveURL(
    new RegExp(`tag=${encodeURIComponent(tag)}.*page=2|page=2.*tag=${encodeURIComponent(tag)}`),
  );
  await expect(articlePreviews).toHaveCount(5);
  await expect(articlePreviews.locator('h1')).toHaveText(secondPageTitles);

  const globalFeedLink = page.getByRole('link', { name: 'Global Feed', exact: true });
  await expect(globalFeedLink).toBeVisible();
  await globalFeedLink.click();

  await expect(page).toHaveURL(new RegExp(`${UI.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}/#/?$`));
  await expect(articlePreviews).toHaveCount(10);
  await expect(page.getByRole('link', { name: '1', exact: true })).toHaveClass(/active/);
});