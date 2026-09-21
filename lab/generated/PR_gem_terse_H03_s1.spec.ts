import { test, expect } from '@playwright/test';
import { newUser, newArticle, UI } from '../support/fixtures';

test.describe('Conduit Acceptance Requirements', () => {
  test('Tag filtering pagination', async ({ page, context }) => {
    const user = await newUser();
    const uniqueTag = `tag-h03-${Date.now()}`;

    // Given there are 15 articles under a specific tag
    // Create 15 articles with unique tag
    for (let i = 1; i <= 15; i++) {
      await newArticle(user, {
        title: `H03 Article ${i.toString().padStart(2, '0')} ${uniqueTag}`,
        tagList: [uniqueTag],
      });
    }

    // When the user filters by that tag on the home page
    await page.goto(`${UI}/#/`);
    await page.getByRole('button', { name: uniqueTag }).click();

    // Verify tag feed is active and first page articles are displayed
    await expect(page.getByRole('button', { name: uniqueTag, exact: true })).toBeVisible();
    await expect(page.getByRole('button', { name: 'Page 1 is your current page' })).toBeVisible();

    // And the user clicks page 2 in the pagination bar
    await page.getByRole('button', { name: 'Page 2' }).click();

    // Then the pagination behavior should match the configuration, showing subsequent articles and updating the URL
    await expect(page).toHaveURL(new RegExp(`tag=${uniqueTag}.*page=2|page=2.*tag=${uniqueTag}`));
    await expect(page.getByRole('button', { name: 'Page 2 is your current page' })).toBeVisible();

    const currentUrl = page.url();

    // When the user opens a new page and directly enters the URL with page=2
    const page2 = await context.newPage();
    await page2.goto(currentUrl);

    // Then the pagination behavior should match the configuration, showing subsequent articles
    await expect(page2.getByRole('button', { name: 'Page 2 is your current page' })).toBeVisible();
    await page2.close();

    // When the user switches back to the all articles list
    await page.getByRole('button', { name: 'Global Feed' }).click();

    // Then the pagination behavior should match the configuration
    await expect(page.getByRole('button', { name: 'Global Feed' })).toHaveClass(/active/);
    await expect(page.getByRole('button', { name: 'Page 1 is your current page' })).toBeVisible();
  });
});