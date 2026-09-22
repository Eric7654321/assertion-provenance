import { test, expect } from '@playwright/test';
import { newUser, newArticle, UI } from '../support/fixtures';

test.describe('Conduit Acceptance Tests', () => {
  test('Pagination with tag filter', async ({ page }) => {
    const user = await newUser();
    const specificTag = `tag_${Date.now()}`;

    // Given there are 15 articles under a specific tag
    for (let i = 1; i <= 15; i++) {
      await newArticle(user, {
        title: `Tag Article ${String(i).padStart(2, '0')} ${Date.now()}_${i}`,
        description: `Description ${i}`,
        body: `Body content for article ${i}`,
        tagList: [specificTag],
      });
    }

    // Go to home page
    await page.goto(`${UI}/#/`);

    // When a user filters articles by this tag on the home page
    const tagButton = page.locator(`.tag-list, .sidebar`).getByText(specificTag, { exact: true });
    await expect(tagButton).toBeVisible();
    await tagButton.click();

    // Verify tag tab is active
    const activeTab = page.locator('.feed-toggle .nav-link.active');
    await expect(activeTab).toContainText(specificTag);

    // Then the number of displayed articles matches the pagination setting (Conduit default is 10)
    const articles = page.locator('.article-preview');
    await expect(articles).toHaveCount(10);

    // When the user selects page 2 from the pagination controls
    const page2Button = page.locator('.pagination .page-item').getByText('2', { exact: true });
    await expect(page2Button).toBeVisible();
    await page2Button.click();

    // Then the second page shows the subsequent articles (15 total - 10 = 5 articles)
    await expect(articles).toHaveCount(5);

    // And the URL reflects page 2
    await expect(page).toHaveURL(/page=2/);
    const page2Url = page.url();

    // When the user directly opens the URL with page 2
    await page.goto(page2Url);

    // Then the user arrives at the same page
    await expect(page.locator('.feed-toggle .nav-link.active')).toContainText(specificTag);
    await expect(articles).toHaveCount(5);
    const activePageItem = page.locator('.pagination .page-item.active');
    await expect(activePageItem).toContainText('2');

    // When the user switches back to the all articles list
    const globalFeedTab = page.locator('.feed-toggle').getByRole('link', { name: 'Global Feed' });
    await globalFeedTab.click();

    // Then the list returns to the first page
    await expect(page.locator('.feed-toggle .nav-link.active')).toContainText('Global Feed');
    await expect(page.locator('.pagination .page-item.active')).toContainText('1');
    expect(page.url()).not.toContain('page=2');
  });
});