import { test, expect } from '@playwright/test';
import { newUser, newArticle, loginAs, UI } from '../support/fixtures';

test.describe('Conduit Acceptance Criteria', () => {
  test('@item:S10 Favorite an article', async ({ page }) => {
    // 1. 建立作者與一篇文章（初始 favorite count 為 0）
    const author = await newUser();
    const article = await newArticle(author);

    // 2. 建立另一個使用者並登入
    const user = await newUser();
    await loginAs(page, user);

    // 3. 該使用者開啟該文章頁面
    await page.goto(`${UI}/#/article/${article.slug}`);

    // 定位 Favorite 按鈕（通常在 article-actions / banner 內，含有 Favorite 文字與 (0)）
    const favoriteButton = page.getByRole('button', { name: /Favorite Article/i }).first();
    await expect(favoriteButton).toBeVisible();
    await expect(favoriteButton).toContainText('(0)');

    // 4. 使用者點擊收藏文章
    await favoriteButton.click();

    // 5. 驗證按鈕狀態變為 Unfavorite 且計數從 0 變為 1
    const unfavoriteButton = page.getByRole('button', { name: /Unfavorite Article/i }).first();
    await expect(unfavoriteButton).toBeVisible();
    await expect(unfavoriteButton).toContainText('(1)');
  });
});