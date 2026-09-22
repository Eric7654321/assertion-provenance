import { test, expect } from '@playwright/test';
import { newUser, newArticle, UI } from '../support/fixtures';

test.describe('Conduit Acceptance Tests', () => {
  test('Pagination under tag filter (@item:H03)', async ({ page, context }) => {
    const author = await newUser();
    const tagName = `tag-${Date.now()}`;

    // Given there are 15 articles under a specific tag
    for (let i = 1; i <= 15; i++) {
      await newArticle(author, {
        title: `Tag Article ${i.toString().padStart(2, '0')} - ${Date.now()}`,
        tagList: [tagName],
      });
    }

    // Go to home page
    await page.goto(`${UI}/#/`);

    // When I filter by this tag on the home page
    const tagButton = page.locator('.tag-list, .tag-default').filter({ hasText: tagName }).first();
    await expect(tagButton).toBeVisible();
    await tagButton.click();

    // Then the number of articles per page matches the pagination setting (typically 10 per page in Conduit)
    const articlePreviews = page.locator('.article-preview');
    await expect(articlePreviews.first()).toBeVisible();
    await expect(articlePreviews).toHaveCount(10);

    const firstPageFirstArticleTitle = await articlePreviews.first().locator('h1').textContent();

    // When I select page 2 in the pagination bar
    const page2Button = page.locator('.pagination .page-item, .pagination li').filter({ hasText: '2' }).first();
    await expect(page2Button).toBeVisible();
    await page2Button.click();

    // Then the second page displays the consecutive articles
    await expect(articlePreviews).toHaveCount(5);
    const secondPageFirstArticleTitle = await articlePreviews.first().locator('h1').textContent();
    expect(secondPageFirstArticleTitle).not.toEqual(firstPageFirstArticleTitle);

    // And the URL reflects the current page number
    await expect(page).toHaveURL(/page=2/);
    const page2Url = page.url();

    // When I open a new page directly with the URL containing page=2
    const newPage = await context.newPage();
    await newPage.goto(page2Url);

    // Then I arrive at the same page
    const newPageArticlePreviews = newPage.locator('.article-preview');
    await expect(newPageArticlePreviews.first()).toBeVisible();
    await expect(newPageArticlePreviews).toHaveCount(5);
    const newPageFirstArticleTitle = await newPageArticlePreviews.first().locator('h1').textContent();
    expect(newPageFirstArticleTitle).toEqual(secondPageFirstArticleTitle);
    await newPage.close();

    // When I switch back to the all articles list
    const globalFeedTab = page.locator('.feed-toggle a, .nav-link').filter({ hasText: /Global Feed|All/i }).first();
    await globalFeedTab.click();

    // Then the list returns to the first page
    await expect(articlePreviews.first()).toBeVisible();
    await expect(page).not.toHaveURL(/page=2/);
    const activePageItem = page.locator('.pagination .page-item.active, .pagination li.active');
    if (await activePageItem.count() > 0) {
      await expect(activePageItem.first()).toHaveText('1');
    }
  });
});