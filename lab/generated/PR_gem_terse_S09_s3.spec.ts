import { test, expect } from '@playwright/test';
import { newUser, newArticle, loginAs, apiCall, UI } from '../support/fixtures';

test.describe('Visibility of comment deletion', () => {
  test('deleting a comment is only available for one\'s own comment', async ({ page }) => {
    // 建立文章作者與兩位留言者
    const author = await newUser();
    const userA = await newUser();
    const userB = await newUser();
    const article = await newArticle(author);

    // User A 透過 API 在該文章留言
    const commentAContent = 'Comment from User A';
    const commentARes = await apiCall(
      `/articles/${article.slug}/comments`,
      'POST',
      { comment: { body: commentAContent } },
      userA.token
    );
    expect(commentARes.status).toBe(200);

    // User B 登入並造訪該文章頁面
    await loginAs(page, userB);
    await page.goto(`${UI}/#/article/${article.slug}`);

    // User B 留自己的留言
    const commentBContent = 'Comment from User B';
    const commentInput = page.getByRole('textbox', { name: 'Write a comment...' });
    await expect(commentInput).toBeVisible();
    await commentInput.fill(commentBContent);
    await page.getByRole('button', { name: 'Post Comment' }).click();

    // 等待兩則留言皆顯示在頁面上
    const cardA = page.locator('.card', { hasText: commentAContent });
    const cardB = page.locator('.card', { hasText: commentBContent });

    await expect(cardA).toBeVisible();
    await expect(cardB).toBeVisible();

    // 驗證 User B 只能看到自己留言的刪除按鈕（通常為 .mod-options 或帶有 trash 圖示的按鈕）
    await expect(cardB.locator('.mod-options')).toBeVisible();
    await expect(cardA.locator('.mod-options')).toHaveCount(0);
  });
});