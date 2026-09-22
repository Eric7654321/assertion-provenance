import { test, expect } from '@playwright/test';
import { newUser, newArticle, loginAs, UI } from '../support/fixtures';

test.describe('Conduit Acceptance Tests', () => {
  test('@item:S07 Author deletes their own article', async ({ page }) => {
    // 建立作者使用者並發布一篇文章
    const author = await newUser();
    const article = await newArticle(author);

    // 以作者身分登入
    await loginAs(page, author);

    // 瀏覽至該文章頁面 (hash routing)
    await page.goto(`${UI}/#/article/${article.slug}`);

    // 等待文章載入確認
    await expect(page.locator('h1')).toHaveText(article.title);

    // 點擊刪除按鈕 (Conduit 標準按鈕：包含 "Delete Article" 或 .btn-outline-danger)
    const deleteButton = page.getByRole('button', { name: /delete article/i }).first();
    await deleteButton.click();

    // 刪除後導回首頁或全域動態列表
    await page.waitForURL(`${UI}/#/`);

    // 切換至 Global Feed 確保文章列表載入（若預設為 Your Feed）
    const globalFeedTab = page.getByRole('button', { name: /global feed/i }).or(page.getByText('Global Feed'));
    if (await globalFeedTab.isVisible()) {
      await globalFeedTab.click();
    }

    // 驗證首頁文章列表中不再出現該文章標題
    await expect(page.getByRole('heading', { name: article.title })).not.toBeVisible();
    await expect(page.locator('.article-preview').filter({ hasText: article.title })).toHaveCount(0);
  });
});