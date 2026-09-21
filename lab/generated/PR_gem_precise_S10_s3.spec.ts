import { test, expect } from '@playwright/test';
import { newUser, newArticle, loginAs, UI } from '../support/fixtures';

test.describe('Conduit Acceptance Tests', () => {
  test('Favorite an article', async ({ page }) => {
    // 建立作者並發布文章（初始 0 個收藏）
    const author = await newUser();
    const article = await newArticle(author);

    // 建立讀者使用者並登入（不同使用者看文章才會有 Favorite 按鈕，而非 Edit/Delete）
    const reader = await newUser();
    await loginAs(page, reader);

    // 開啟該文章頁面
    await page.goto(`${UI}/#/article/${article.slug}`);

    // 定位收藏按鈕（通常有 Favorite 字樣及計數 (0)）
    const favoriteBtn = page.getByRole('button', { name: /Favorite/i }).first();
    await expect(favoriteBtn).toBeVisible();
    await expect(favoriteBtn).toContainText('0');

    // 點擊收藏文章
    await favoriteBtn.click();

    // 驗證按鈕切換為已收藏狀態（或顯示 Unfavorite），且計數從 0 變為 1
    await expect(favoriteBtn).toContainText('1');
    await expect(favoriteBtn).toContainText(/Unfavorite/i);
  });
});