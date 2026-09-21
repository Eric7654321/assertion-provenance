import { test, expect } from '@playwright/test';
import { newUser, newArticle, loginAs, UI } from '../support/fixtures';

test.describe('Conduit Acceptance Tests', () => {
  test('Favorite an article', async ({ page }) => {
    // 建立文章作者與觀看者（兩個不同使用者，確保觀看者看到的是 Favorite 按鈕而非 Edit/Delete）
    const author = await newUser();
    const reader = await newUser();

    const article = await newArticle(author);

    // 以讀者身份登入
    await loginAs(page, reader);

    // 前往該文章頁面
    await page.goto(`${UI}/#/article/${article.slug}`);

    // 定位 Favorite 按鈕（通常在 article-actions 或 banner 處）
    const favoriteBtn = page.getByRole('button', { name: /Favorite Article/i }).first();
    await expect(favoriteBtn).toBeVisible();
    await expect(favoriteBtn).toContainText('(0)');

    // 點擊 Favorite 按鈕
    await favoriteBtn.click();

    // 驗證按鈕狀態變為 Unfavorite 且計數從 0 變成 1
    const unfavoriteBtn = page.getByRole('button', { name: /Unfavorite Article/i }).first();
    await expect(unfavoriteBtn).toBeVisible();
    await expect(unfavoriteBtn).toContainText('(1)');
  });
});