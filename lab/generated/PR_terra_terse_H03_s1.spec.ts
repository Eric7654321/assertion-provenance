import { expect, test } from '@playwright/test';
import {
  apiCall,
  loginAs,
  newArticle,
  newUser,
  UI,
} from '../support/fixtures';

test('H03: tag filtering pagination', async ({ page, context }) => {
  const user = await newUser();
  const tag = `pagination-tag-${Date.now()}`;

  for (let index = 1; index <= 15; index++) {
    await newArticle(user, {
      title: `Pagination article ${index}`,
      description: `Article ${index} for tag pagination`,
      body: `Body for pagination article ${index}`,
      tagList: [tag],
    });
  }

  await loginAs(page, user);
  await page.goto(`${UI}/#/`);

  const tagLink = page.getByRole('link', { name: tag, exact: true });
  await expect(tagLink).toBeVisible();
  await tagLink.click();

  await expect(page).toHaveURL(new RegExp(`#/?\\?tag=${tag}`));

  const articlePreviews = page.locator('.article-preview');
  await expect(articlePreviews).toHaveCount(10);
  await expect(articlePreviews.first()).toContainText('Pagination article 15');

  const page2 = page.getByRole('link', { name: '2', exact: true });
  await expect(page2).toBeVisible();
  await page2.click();

  await expect(page).toHaveURL(
    new RegExp(`#/?\\?tag=${tag}&page=2|#/?\\?page=2&tag=${tag}`),
  );
  await expect(articlePreviews).toHaveCount(5);
  await expect(articlePreviews.first()).toContainText('Pagination article 5');

  const directPage = await context.newPage();
  await loginAs(directPage, user);
  await directPage.goto(`${UI}/#/?tag=${encodeURIComponent(tag)}&page=2`);

  const directArticlePreviews = directPage.locator('.article-preview');
  await expect(directArticlePreviews).toHaveCount(5);
  await expect(directArticlePreviews.first()).toContainText(
    'Pagination article 5',
  );

  const globalFeed = page.getByRole('link', { name: 'Global Feed', exact: true });
  await expect(globalFeed).toBeVisible();
  await globalFeed.click();

  await expect(page).toHaveURL(/#\/?$/);
  await expect(articlePreviews).toHaveCount(10);
  await expect(page.getByRole('link', { name: '2', exact: true })).toBeVisible();

  await directPage.close();
});