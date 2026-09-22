import { test, expect } from '@playwright/test';
import { newUser, newArticle, loginAs, apiCall, UI } from '../support/fixtures';

test.describe('Conduit Acceptance Tests', () => {
  test('Comment deletion visibility (@item:S09)', async ({ page }) => {
    // Given user A posts a comment on an article
    const userA = await newUser();
    const userB = await newUser();
    const article = await newArticle(userA);

    const commentBodyA = 'Comment by User A - ' + Date.now();
    await apiCall(
      `/articles/${article.slug}/comments`,
      'POST',
      { comment: { body: commentBodyA } },
      userA.token
    );

    // When user B opens the same article and posts their own comment
    await loginAs(page, userB);
    await page.goto(`${UI}/#/article/${article.slug}`);

    const commentBodyB = 'Comment by User B - ' + Date.now();
    await page.getByPlaceholder(/write a comment/i).fill(commentBodyB);
    await page.getByRole('button', { name: /post comment/i }).click();

    // Then user B cannot see the delete control for user A's comment
    const commentCardA = page.locator('.card', { hasText: commentBodyA });
    await expect(commentCardA).toBeVisible();
    await expect(commentCardA.locator('.mod-options, .ion-trash-a, button:has-text("Delete")')).not.toBeVisible();

    // And user B can see the delete control for their own comment
    const commentCardB = page.locator('.card', { hasText: commentBodyB });
    await expect(commentCardB).toBeVisible();
    await expect(commentCardB.locator('.mod-options, .ion-trash-a, button:has-text("Delete")')).toBeVisible();
  });
});