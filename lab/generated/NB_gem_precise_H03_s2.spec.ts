import { test, expect } from '@playwright/test';
import { newUser, newArticle, UI } from '../support/fixtures';

test.describe('Conduit Acceptance Criteria', () => {
  test('@item:H03 Tag-filtered pagination', async ({ page, context }) => {
    // Given there are 15 articles under a specific tag
    const user = await newUser();
    const specificTag = `tag_${Date.now()}`;
    const totalArticles = 15;

    // Create 15 articles with the specific tag
    for (let i = 1; i <= totalArticles; i++) {
      await newArticle(user, {
        title: `Tag Article ${i} ${Date.now()}_${i}`,
        description: `Description ${i}`,
        body: `Body ${i}`,
        tagList: [specificTag],
      });
    }

    // Navigate to Home page
    await page.goto(`${UI}/#/`);

    // When the user filters by that tag on the home page
    const tagSelector = page.locator('.sidebar, .tag-list').locator('text=' + specificTag).first();
    await expect(tagSelector).toBeVisible();
    await tagSelector.click();

    // Verify tag tab is active
    await expect(page.locator('.feed-toggle .nav-link.active')).toContainText(specificTag);

    // Then the number of articles per page should match the pagination settings (standard Conduit page size is 10)
    const articlePreviews = page.locator('.article-preview');
    await expect(articlePreviews.first()).toBeVisible();
    await expect(articlePreviews).toHaveCount(10);

    // Get the title of the first article on page 1 for later continuation check
    const page1FirstTitle = await articlePreviews.first().locator('h1').textContent();

    // When the user selects page 2 from the pagination controls
    const pagination = page.locator('.pagination');
    const page2Button = pagination.locator('.page-item').filter({ hasText: '2' }).locator('.page-link');
    await expect(page2Button).toBeVisible();
    await page2Button.click();

    // Then the articles displayed should be the continuation of the list (page 2 should have 5 articles)
    await expect(articlePreviews).toHaveCount(5);
    const page2FirstTitle = await articlePreviews.first().locator('h1').textContent();
    expect(page2FirstTitle).not.toEqual(page1FirstTitle);

    // And the URL should reflect the current page number
    expect(page.url()).toContain('page=2');
    const page2Url = page.url();

    // When the user directly navigates to the URL with page=2 in a new page
    const newPage = await context.newPage();
    await newPage.goto(page2Url);

    // Then the user should arrive at the same page
    await expect(newPage.locator('.feed-toggle .nav-link.active')).toContainText(specificTag);
    const newPagePreviews = newPage.locator('.article-preview');
    await expect(newPagePreviews).toHaveCount(5);
    const newPageFirstTitle = await newPagePreviews.first().locator('h1').textContent();
    expect(newPageFirstTitle).toEqual(page2FirstTitle);
    await newPage.close();

    // When the user switches back to the all articles list (Global Feed)
    const globalFeedTab = page.locator('.feed-toggle').locator('text=Global Feed');
    await globalFeedTab.click();
    await expect(globalFeedTab).toHaveClass(/active/);

    // Then the list should return to page 1
    const activePageItem = page.locator('.pagination .page-item.active');
    // If pagination exists, page 1 should be active, and URL should not point to page=2
    if (await activePageItem.isVisible()) {
      await expect(activePageItem).toContainText('1');
    }
    expect(page.url()).not.toContain('page=2');
  });
});