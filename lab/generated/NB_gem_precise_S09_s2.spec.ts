import { test, expect } from '@playwright/test';
import { newUser, newArticle, loginAs, apiCall, UI } from '../support/fixtures';

test.describe('Conduit Acceptance Criteria', () => {
  test('Comment deletion control visibility', async ({ page }) => {
    // Given user A leaves a comment on an article
    const userA = await newUser();
    const article = await newArticle(userA);

    const commentABody = `Comment by user A ${Date.now()}`;
    await apiCall(
      `articles/${article.slug}/comments`,
      'POST',
      { comment: { body: commentABody } },
      userA.token
    );

    // User B setup
    const userB = await newUser();

    // When user B opens the same article and leaves their own comment
    await loginAs(page, userB);
    await page.goto(`${UI}/#/article/${article.slug}`);

    const commentBBody = `Comment by user B ${Date.now()}`;
    await page.locator('textarea').fill(commentBBody);
    await page.locator('button:has-text("Post Comment")').click();

    const commentCardA = page.locator('.card', { hasText: commentABody });
    const commentCardB = page.locator('.card', { hasText: commentBBody });

    // Wait for user B's comment to appear
    await expect(commentCardB).toBeVisible();
    await expect(commentCardA).toBeVisible();

    const deleteControlSelector = '.ion-trash-a, .mod-options, button:has-text("Delete")';

    // Then user B should not see the delete control for user A's comment
    await expect(commentCardA.locator(deleteControlSelector)).toHaveCount(0);

    // And user B should see the delete control for their own comment
    await expect(commentCardB.locator(deleteControlSelector)).toBeVisible();
  });
});