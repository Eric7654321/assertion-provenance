import { test, expect } from '@playwright/test';
import { newUser, newArticle, UI } from '../support/fixtures';

test.describe('Tag filter pagination', () => {
  test('Scenario: Tag filter pagination', { tag: '@item:H03' }, async ({ page, context }) => {
    const user = await newUser();
    const tag = `tag-${Date.now()}`;

    // Given there are 15 articles under a specific tag
    for (let i = 1; i <= 15; i++) {
      await newArticle(user, {
        title: `Tag Article ${i.toString().padStart(2, '0')} ${Date.now()}`,
        tagList: [tag],
      });
    }

    // When the user filters by that tag on the home page
    await page.goto(`${UI}/#/`);

    // Click the tag under Popular Tags
    const tagButton = page.getByRole('button', { name: tag, exact: true });
    await expect(tagButton).toBeVisible();
    await tagButton.click();

    // And selects page 2 from the pagination bar
    const pagination = page.getByRole('navigation', { name: 'Pagination' });
    const page2Button = pagination.getByRole('button', { name: 'Page 2', exact: true });
    await expect(page2Button).toBeVisible();
    await page2Button.click();

    // Then subsequent articles should be visible
    // And the URL should reflect the change
    await expect(page).toHaveURL(new RegExp(`tag=${tag}.*page=2|page=2.*tag=${tag}`));
    const currentPage2Btn = pagination.getByRole('button', { name: /Page 2 is your current page|2/ });
    await expect(currentPage2Btn).toBeVisible();

    // Verify articles are displayed (15 total, default 10 per page -> 5 on page 2)
    const articles = page.locator('.article-preview');
    await expect(articles).toHaveCount(5);

    // When the user opens a new page and navigates directly to the URL with page=2
    const targetUrl = page.url();
    const newPage = await context.newPage();
    await newPage.goto(targetUrl);

    // Then subsequent articles should be visible
    const newPagePagination = newPage.getByRole('navigation', { name: 'Pagination' });
    await expect(newPagePagination.getByRole('button', { name: /Page 2 is your current page|2/ })).toBeVisible();
    await expect(newPage.locator('.article-preview')).toHaveCount(5);

    // When the user switches back to the all articles list
    const globalFeedTab = newPage.getByRole('button', { name: 'Global Feed' });
    await globalFeedTab.click();

    // Then the pagination behavior should meet expectations
    // Global feed defaults to page 1 or shows page 1 active
    await expect(newPage.getByRole('button', { name: 'Global Feed' })).toHaveClass(/active/);
    const globalPagination = newPage.getByRole('navigation', { name: 'Pagination' });
    await expect(globalPagination.getByRole('button', { name: /Page 1 is your current page|1/ })).toBeVisible();
  });
});