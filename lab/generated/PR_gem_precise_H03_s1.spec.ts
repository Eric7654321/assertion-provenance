import { test, expect } from '@playwright/test';
import { newUser, newArticle, UI } from '../support/fixtures';

test.describe('Conduit Acceptance Tests', () => {
  test('Pagination under tag filter', async ({ page }) => {
    const user = await newUser();
    const tag = `tag-${Date.now()}`;

    // Given there are 15 articles under a specific tag
    // Create 15 articles in sequential order so we know their titles and sequence
    const articleTitles: string[] = [];
    for (let i = 1; i <= 15; i++) {
      const title = `Article ${i.toString().padStart(2, '0')} for ${tag}`;
      articleTitles.push(title);
      await newArticle(user, {
        title,
        description: `Description ${i}`,
        body: `Body ${i}`,
        tagList: [tag],
      });
    }

    // Default pagination limit is 10
    // Conduit lists articles newest first, so articleTitles are in reverse order on page 1:
    // Page 1: 15, 14, 13, 12, 11, 10, 09, 08, 07, 06 (10 articles)
    // Page 2: 05, 04, 03, 02, 01 (5 articles)
    const reversedTitles = [...articleTitles].reverse();
    const expectedPage1Titles = reversedTitles.slice(0, 10);
    const expectedPage2Titles = reversedTitles.slice(10, 15);

    // When I filter by this tag on the home page
    await page.goto(UI);
    const tagButton = page.getByRole('button', { name: tag });
    await expect(tagButton).toBeVisible();
    await tagButton.click();

    // Then the number of articles per page matches the pagination setting (10 per page)
    const articlePreviewHeadings = page.locator('.article-preview h1');
    await expect(articlePreviewHeadings).toHaveCount(10);
    for (let i = 0; i < 10; i++) {
      await expect(articlePreviewHeadings.nth(i)).toHaveText(expectedPage1Titles[i]);
    }

    // When I select page 2 in the pagination bar
    const page2Button = page.getByRole('button', { name: 'Page 2', exact: true });
    await expect(page2Button).toBeVisible();
    await page2Button.click();

    // Then the second page displays the consecutive articles
    await expect(articlePreviewHeadings).toHaveCount(5);
    for (let i = 0; i < 5; i++) {
      await expect(articlePreviewHeadings.nth(i)).toHaveText(expectedPage2Titles[i]);
    }

    // And the URL reflects the current page number
    await expect(page).toHaveURL(/page=2/);
    const page2Url = page.url();

    // When I open a new page directly with the URL containing page=2
    await page.goto(page2Url);

    // Then I arrive at the same page
    await expect(articlePreviewHeadings).toHaveCount(5);
    for (let i = 0; i < 5; i++) {
      await expect(articlePreviewHeadings.nth(i)).toHaveText(expectedPage2Titles[i]);
    }
    await expect(page.getByRole('button', { name: 'Page 2 is your current page' })).toBeVisible();

    // When I switch back to the all articles list (Global Feed)
    const globalFeedTab = page.getByRole('button', { name: 'Global Feed' });
    await globalFeedTab.click();

    // Then the list returns to the first page
    await expect(page.getByRole('button', { name: 'Page 1 is your current page' })).toBeVisible();
    await expect(page).not.toHaveURL(/page=2/);
  });
});