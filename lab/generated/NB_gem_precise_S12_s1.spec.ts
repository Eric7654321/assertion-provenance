import { test, expect } from '@playwright/test';
import { newUser, newArticle, UI } from '../support/fixtures';

test.describe('Conduit Acceptance Tests', () => {
  test('Article list pagination', async ({ page }) => {
    // 確保有足夠文章觸發分頁（Conduit 預設一頁 10 篇，建立 11 篇）
    const user = await newUser();
    for (let i = 1; i <= 11; i++) {
      await newArticle(user, {
        title: `Pagination Test Article ${i} ${Date.now()}`,
        description: `Description ${i}`,
        body: `Body content ${i}`,
        tagList: ['pagination-test'],
      });
    }

    // 瀏覽首頁
    await page.goto(`${UI}/#/`);

    // 確保切換至 Global Feed
    const globalFeedTab = page.locator('.feed-toggle').getByText('Global Feed');
    if (await globalFeedTab.isVisible()) {
      await globalFeedTab.click();
    }

    // 等待文章列表加載完成
    await expect(page.locator('.article-preview').first()).toBeVisible();

    // 取得第一頁顯示的第一篇文章標題作為比對基準
    const firstPageArticleTitle = await page.locator('.article-preview h1').first().textContent();

    // 捲動至分頁列
    const pagination = page.locator('.pagination');
    await pagination.scrollIntoViewIfNeeded();
    await expect(pagination).toBeVisible();

    // 點選第 2 頁
    const page2Button = pagination.locator('.page-item, li').filter({ hasText: '2' }).locator('a, button');
    await page2Button.click();

    // 驗證分頁狀態變為 active
    const activePage = pagination.locator('.page-item.active, li.active');
    await expect(activePage).toContainText('2');

    // 驗證列表顯示出接續的文章（文章已換頁，第一篇標題不同且有文章顯示）
    await expect(page.locator('.article-preview').first()).toBeVisible();
    const secondPageArticleTitle = await page.locator('.article-preview h1').first().textContent();
    expect(secondPageArticleTitle).not.toBe(firstPageArticleTitle);
  });
});