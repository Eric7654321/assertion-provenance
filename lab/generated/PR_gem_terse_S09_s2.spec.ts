import { test, expect } from '@playwright/test';
import { newUser, newArticle, loginAs, apiCall, UI } from '../support/fixtures';

test.describe('Visibility of comment deletion', () => {
  test('deleting a comment should only be possible for one\'s own comment', async ({ page }) => {
    // 建立兩個使用者：user A 與 user B
    const userA = await newUser();
    const userB = await newUser();

    // 建立一篇文章（可以用 userA 發表）
    const article = await newArticle(userA);

    // Given user A posts a comment on an article
    const commentTextA = 'Comment by user A ' + Date.now();
    await apiCall(`/articles/${article.slug}/comments`, 'POST', {
      comment: { body: commentTextA },
    }, userA.token);

    // When user B opens the same article and posts their own comment
    await loginAs(page, userB);
    await page.goto(`${UI}/#/article/${article.slug}`);

    const commentInput = page.getByRole('textbox', { name: 'Write a comment...' });
    await expect(commentInput).toBeVisible();

    const commentTextB = 'Comment by user B ' + Date.now();
    await commentInput.fill(commentTextB);
    await page.getByRole('button', { name: 'Post Comment' }).click();

    // 等待兩則留言都出現
    const cardA = page.locator('.card', { hasText: commentTextA });
    const cardB = page.locator('.card', { hasText: commentTextB });

    await expect(cardA).toBeVisible();
    await expect(cardB).toBeVisible();

    // Then deleting a comment should only be possible for one's own comment
    // user B 對自己發表的 comment 應該有刪除按鈕/圖示
    // Conduit 通常是 .mod-options 或 trash icon (i.ion-trash-a 等)
    const deleteButtonInB = cardB.locator('.mod-options, .ion-trash-a, [aria-label*="Delete"], button:has(.ion-trash-a)');
    await expect(deleteButtonInB.first()).toBeVisible();

    // user B 對 user A 發表的 comment 不應該看到刪除按鈕
    const deleteButtonInA = cardA.locator('.mod-options, .ion-trash-a, [aria-label*="Delete"], button:has(.ion-trash-a)');
    await expect(deleteButtonInA).toHaveCount(0);
  });
});