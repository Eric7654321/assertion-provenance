import { test, expect } from '@playwright/test';
import { newUser, newArticle, UI } from '../support/fixtures';

test.describe('Pagination with tag filter', () => {
  test('Scenario: Pagination with tag filter', { tag: '@item:H03' }, async ({ page }) => {
    // Given there are 15 articles under a specific tag
    const tag = `test-tag-${Date.now()}`;
    const author = await newUser();

    const createdArticles = [];
    for (let i = 1; i <= 15; i++) {
      const art = await newArticle(author, {
        title: `Tag Article ${String(i).padStart(2, '0')} ${Date.now()}`,
        description: `Description ${i}`,
        body: `Body content ${i}`,
        tagList: [tag],
      });
      createdArticles.push(art);
    }

    // When a user filters articles by this tag on the home page
    await page.goto(`${UI}#/`);
    
    // Wait for the tag to appear in Popular Tags and click it
    const tagButton = page.getByRole('button', { name: tag, exact: true });
    await expect(tagButton).toBeVisible();
    await tagButton.click();

    // Then the number of displayed articles matches the pagination setting (conduit default page size is 10)
    const pagination = page.getByRole('navigation', { name: 'Pagination' });
    await expect(pagination).toBeVisible();

    const articlesLocator = page.locator('.article-preview');
    await expect(articlesLocator).toHaveCount(10);

    // Record the first article title on page 1
    const firstPageFirstArticleTitle = await articlesLocator.first().locator('h1').innerText();

    // When the user selects page 2 from the pagination controls
    const page2Button = pagination.getByRole('button', { name: 'Page 2' });
    await page2Button.click();

    // Then the second page shows the subsequent articles (5 articles remaining out of 15)
    await expect(articlesLocator).toHaveCount(5);
    const secondPageFirstArticleTitle = await articlesLocator.first().locator('h1').innerText();
    expect(secondPageFirstArticleTitle).not.toBe(firstPageFirstArticleTitle);

    // And the URL reflects page 2
    await expect(page).toHaveURL(new RegExp(`page=2`));
    const page2Url = page.url();

    // When the user directly opens the URL with page 2
    await page.goto(page2Url);

    // Then the user arrives at the same page
    await expect(articlesLocator).toHaveCount(5);
    await expect(articlesLocator.first().locator('h1')).toHaveText(secondPageFirstArticleTitle);

    // When the user switches back to the all articles list (Global Feed)
    const globalFeedTab = page.getByRole('button', { name: 'Global Feed' });
    await globalFeedTab.click();

    // Then the list returns to the first page
    await expect(page).not.toHaveURL(new RegExp(`page=2`));
    // Check pagination or active page indicator
    const activePage = pagination.locator('.page-item.active, button[aria-current="true"]');
    if (await activePage.count() > 0) {
      await expect(activePage.first()).toContainText('1');
    }
  });
});