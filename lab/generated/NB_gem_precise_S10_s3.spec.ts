import { test, expect } from '@playwright/test';
import { newUser, newArticle, loginAs, UI } from '../support/fixtures';

test.describe('Conduit Acceptance Tests', () => {
  test('@item:S10 Favorite an article', async ({ page }) => {
    // 建立文章作者與文章
    const author = await newUser();
    const article = await newArticle(author);

    // 建立登入使用者並登入
    const user = await newUser();
    await loginAs(page, user);

    // 瀏覽至該文章頁面（Hash 路由）
    await page.goto(`${UI}/#/article/${article.slug}`);

    // 定位收藏按鈕（通常文章頁面頂部或底部的 Favorite 按鈕，包含文字 Favorite (0) 或 Favorite Post）
    // Conduit 的 favorite 按鈕常包含文字 "Favorite"
    const favoriteBtn = page.getByRole('button', { name: /Favorite/i }).first();
    await expect(favoriteBtn).toBeVisible();
    await expect(favoriteBtn).toContainText('0');

    // 點擊收藏文章
    await favoriteBtn.click();

    // 驗證按鈕切換為已收藏狀態（包含 Unfavorite）且計數從 0 變為 1
    await expect(favoriteBtn).toContainText(/Unfavorite/i);
    await expect(favoriteBtn).toContainText('1');
  });
});