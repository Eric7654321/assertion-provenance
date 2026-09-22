import { test, expect } from '@playwright/test';
import { newUser, newArticle, loginAs, UI } from '../support/fixtures';

test.describe('Conduit Acceptance Criteria', () => {
  test('Favorite an article', async ({ page }) => {
    // 建立文章作者與文章
    const author = await newUser();
    const article = await newArticle(author);

    // 建立另一位讀者使用者並登入（非作者才能看到 Favorite 按鈕）
    const reader = await newUser();
    await loginAs(page, reader);

    // 前往該文章頁面
    await page.goto(`${UI}/#/article/${article.slug}`);

    // 定位文章頁面上的 Favorite 按鈕
    const favoriteButton = page.getByRole('button', { name: /Favorite/i }).first();

    // 驗證初始狀態：尚未收藏且計數為 0
    await expect(favoriteButton).toContainText('Favorite');
    await expect(favoriteButton).not.toContainText('Unfavorite');
    await expect(favoriteButton).toContainText('(0)');

    // 點擊收藏按鈕
    await favoriteButton.click();

    // 驗證收藏後狀態：變為 Unfavorite 且計數變為 1
    await expect(favoriteButton).toContainText('Unfavorite');
    await expect(favoriteButton).toContainText('(1)');
  });
});