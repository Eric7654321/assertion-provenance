import { test, expect } from '@playwright/test';
import { newUser, newArticle, loginAs, apiCall, UI } from '../support/fixtures';

test.describe('Visibility of comment deletion control', () => {
  test('User B does not see delete control for User A comment, but sees it for their own', async ({ page }) => {
    // Given User A has posted a comment on an article
    const userA = await newUser();
    const userB = await newUser();
    const article = await newArticle(userA);

    const commentA = 'Comment by User A ' + Date.now();
    await apiCall(`/articles/${article.slug}/comments`, 'POST', {
      comment: { body: commentA }
    }, userA.token);

    // When User B views the same article and posts their own comment
    await loginAs(page, userB);
    await page.goto(`${UI}/#/article/${article.slug}`);

    const commentB = 'Comment by User B ' + Date.now();
    await page.getByRole('textbox', { name: 'Write a comment...' }).fill(commentB);
    await page.getByRole('button', { name: 'Post Comment' }).click();

    // 等待 User B 的留言出現
    const commentBCard = page.locator('.card', { hasText: commentB });
    await expect(commentBCard).toBeVisible();

    // User A 的留言卡片
    const commentACard = page.locator('.card', { hasText: commentA });
    await expect(commentACard).toBeVisible();

    // Then User B does not see the delete control for User A's comment
    await expect(commentACard.locator('.mod-options i, .ion-trash-a, button:has(.ion-trash-a)')).toHaveCount(0);

    // And User B sees the delete control for their own comment
    await expect(commentBCard.locator('.mod-options i, .ion-trash-a, button:has(.ion-trash-a)')).toBeVisible();
  });
});