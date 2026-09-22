import { test, expect } from '@playwright/test';
import { newUser, newArticle, UI } from '../support/fixtures';

test.describe('Conduit Acceptance Tests', () => {
  test('Article list pagination (@item:S12)', async ({ page }) => {
    // 建立使用者並發布 11 篇文章以觸發分頁（Conduit 首頁預設每頁 10 篇）
    const user = await newUser();
    const articles = [];
    for (let i = 1; i <= 11; i++) {
      const article = await newArticle(user, {
        title: `Pagination Test Article ${i} - ${Date.now()}`,
        description: `Description ${i}`,
        body: `Body content ${i}`,
        tagList: ['pagination-test'],
      });
      articles.push(article);
    }

    // Given a user views the article list on the home page and scrolls to the pagination controls
    await page.goto(`${UI}/#/`);

    // 等待全域文章載入完成
    const globalFeedTab = page.getByRole('button', { name: 'Global Feed' });
    if (await globalFeedTab.isVisible()) {
      await globalFeedTab.click();
    }

    const pagination = page.locator('.pagination');
    await expect(pagination).toBeVisible();

    const page2Btn = pagination.locator('.page-item').filter({ hasText: '2' }).locator('.page-link');
    await expect(page2Btn).toBeVisible();

    // 取得第 1 頁顯示的第一篇文章標題
    const firstArticleOnPage1 = page.locator('.article-preview h1').first();
    const page1Title = await firstArticleOnPage1.innerText();

    // When the user selects page 2
    await page2Btn.click();

    // Then the subsequent articles are displayed
    // 驗證第二頁按鈕呈現 active 狀態
    const activePageItem = pagination.locator('.page-item.active');
    await expect(activePageItem).toHaveText('2');

    // 驗證文章清單已刷新，內容與第一頁不同
    const firstArticleOnPage2 = page.locator('.article-preview h1').first();
    await expect(firstArticleOnPage2).toBeVisible();
    await expect(firstArticleOnPage2).not.toHaveText(page1Title);
  });
});