import { test, expect } from '@playwright/test';
import { newUser, newArticle, UI } from '../support/fixtures';

test.describe('Conduit Acceptance Tests', () => {
  test('Pagination for tag filtering', async ({ page }) => {
    const user = await newUser();
    const tag = `tag_${Date.now()}`;

    // Given there are 15 articles under a specific tag
    // Create 15 articles with this tag
    for (let i = 1; i <= 15; i++) {
      await newArticle(user, {
        title: `Tag Article ${i} ${Date.now()}`,
        description: `Description ${i}`,
        body: `Body ${i}`,
        tagList: [tag],
      });
    }

    // Go to home page
    await page.goto(`${UI}/#/`);

    // When the user filters by that tag on the home page
    const tagButton = page.getByRole('button', { name: tag });
    await expect(tagButton).toBeVisible();
    await tagButton.click();

    // Verify tag feed is active and URL has updated (tag parameter)
    await expect(page).toHaveURL(new RegExp(`tag=${tag}`));
    const pagination = page.getByRole('navigation', { name: 'Pagination' });
    await expect(pagination).toBeVisible();

    // And the user clicks page 2 in the pagination bar
    const page2Button = pagination.getByRole('button', { name: '2', exact: true });
    await expect(page2Button).toBeVisible();
    await page2Button.click();

    // Then the pagination behavior matches the settings, subsequent articles are visible, and the URL changes accordingly
    await expect(page).toHaveURL(new RegExp(`page=2`));
    await expect(page).toHaveURL(new RegExp(`tag=${tag}`));
    await expect(page2Button).toHaveAttribute('aria-current', 'page');

    // When the user opens another page and directly enters the URL with page=2
    await page.goto(`${UI}/#/?tag=${tag}&page=2`);

    // Then the pagination behavior matches the settings, subsequent articles are visible, and the URL changes accordingly
    const newPagination = page.getByRole('navigation', { name: 'Pagination' });
    await expect(newPagination).toBeVisible();
    const directPage2 = newPagination.getByRole('button', { name: '2', exact: true });
    await expect(directPage2).toBeVisible();
    await expect(directPage2).toHaveAttribute('aria-current', 'page');
    await expect(page).toHaveURL(new RegExp(`page=2`));
    await expect(page).toHaveURL(new RegExp(`tag=${tag}`));

    // When the user switches back to the all articles list (Global Feed)
    const globalFeedButton = page.getByRole('button', { name: 'Global Feed' });
    await expect(globalFeedButton).toBeVisible();
    await globalFeedButton.click();

    // Then the pagination behavior matches the settings, subsequent articles are visible, and the URL changes accordingly
    await expect(page).not.toHaveURL(new RegExp(`tag=${tag}`));
    await expect(page.getByRole('navigation', { name: 'Pagination' })).toBeVisible();
  });
});