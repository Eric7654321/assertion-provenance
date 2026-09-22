import { test, expect } from '@playwright/test';
import { UI, newUser, newArticle } from '../support/fixtures';

test.describe('Conduit Acceptance Criteria', () => {
  test('@item:S12 Scenario: Article list pagination', async ({ page }) => {
    // 確保有足夠文章可供分頁（RealWorld Conduit 每頁通常為 10 篇）
    // 建立使用者並發布文章以確保文章數超過一頁門檻
    const author = await newUser();
    const createdArticles: string[] = [];
    for (let i = 1; i <= 11; i++) {
      const art = await newArticle(author, {
        title: `Pagination Test Article ${Date.now()}-${i}`,
        description: `Description ${i}`,
        body: `Body ${i}`,
        tagList: ['pagination-test'],
      });
      createdArticles.push(art.title);
    }

    // 瀏覽至首頁（hash 路由）
    await page.goto(`${UI}/#/`);

    // 確保切換至 Global Feed
    const globalFeedTab = page.locator('button, a', { hasText: 'Global Feed' });
    if (await globalFeedTab.isVisible()) {
      await globalFeedTab.click();
    }

    // 等待文章列表與分頁元件載入
    await page.waitForSelector('.article-preview', { state: 'visible' });

    // 記錄第一頁顯示的文章標題
    const firstPageArticles = await page
      .locator('.article-preview h1, .article-preview h2, .preview-link h1')
      .allTextContents();
    expect(firstPageArticles.length).toBeGreaterThan(0);

    // Given a user scrolls to the pagination controls on the home page article list
    const pagination = page.locator('.pagination, ul.pagination');
    await expect(pagination).toBeVisible();
    await pagination.scrollIntoViewIfNeeded();

    // When the user selects page 2
    const page2Button = pagination.locator('.page-item, li', { hasText: '2' }).locator('a, button');
    await expect(page2Button).toBeVisible();
    await page2Button.click();

    // 等待分頁按鈕 2 變為 active 狀態
    const page2Item = pagination.locator('.page-item', { hasText: '2' });
    await expect(page2Item).toHaveClass(/active/);

    // 等待第二頁文章載入
    await page.waitForSelector('.article-preview', { state: 'visible' });

    // Then the articles displayed should be the continuation of the list
    const secondPageArticles = await page
      .locator('.article-preview h1, .article-preview h2, .preview-link h1')
      .allTextContents();
    expect(secondPageArticles.length).toBeGreaterThan(0);

    // 第二頁的第一篇文章不應出現在第一頁的第一篇，證明是清單的延續
    expect(secondPageArticles[0]).not.toBe(firstPageArticles[0]);
  });
});