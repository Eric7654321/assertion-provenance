import { test, expect } from '@playwright/test';
import { newUser, newArticle, loginAs, UI } from '../support/fixtures';

test.describe('Conduit Acceptance Tests', () => {
  test('Favorite an article', async ({ page }) => {
    // 建立文章作者與閱讀者（按讚者）
    const author = await newUser();
    const reader = await newUser();
    const article = await newArticle(author);

    // 以 reader 身份登入
    await loginAs(page, reader);

    // 瀏覽未收藏且收藏數為 0 的文章頁面 (Hash router: /#/article/:slug)
    await page.goto(`${UI}/#/article/${article.slug}`);

    // 定位收藏按鈕（在 article-actions 或 article-meta 中）
    const favoriteButton = page.locator('.article-actions button, .article-meta button').filter({
      hasText: /Favorite/i,
    }).first();

    // 確認初始狀態收藏數為 0
    await expect(favoriteButton).toContainText('(0)');

    // 點擊收藏按鈕
    await favoriteButton.click();

    // 驗證按鈕變為 Unfavorite 狀態且計數從 0 變為 1
    const unfavoriteButton = page.locator('.article-actions button, .article-meta button').filter({
      hasText: /Unfavorite/i,
    }).first();

    await expect(unfavoriteButton).toBeVisible();
    await expect(unfavoriteButton).toContainText('(1)');
  });
});