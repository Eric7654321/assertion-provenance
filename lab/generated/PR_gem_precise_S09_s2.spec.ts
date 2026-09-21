import { test, expect } from '@playwright/test';
import { newUser, newArticle, loginAs, apiCall, UI } from '../support/fixtures';

test.describe('Conduit Acceptance Criteria', () => {
  test('Scenario: Comment deletion control visibility', async ({ page }) => {
    // Given user A and user B exist, and user A writes an article
    const userA = await newUser();
    const userB = await newUser();
    const article = await newArticle(userA);

    // Given user A leaves a comment on an article
    const commentAText = `Comment by user A ${Date.now()}`;
    await apiCall(`/articles/${article.slug}/comments`, 'POST', {
      comment: { body: commentAText },
    }, userA.token);

    // When user B opens the same article and leaves their own comment
    await loginAs(page, userB);
    await page.goto(`${UI}/#/article/${article.slug}`);

    const commentBText = `Comment by user B ${Date.now()}`;
    await page.getByRole('textbox', { name: 'Write a comment...' }).fill(commentBText);
    await page.getByRole('button', { name: 'Post Comment' }).click();

    // Verify both comments are visible
    const commentACard = page.locator('.card', { hasText: commentAText });
    const commentBCard = page.locator('.card', { hasText: commentBText });

    await expect(commentACard).toBeVisible();
    await expect(commentBCard).toBeVisible();

    // Then user B should not see the delete control for user A's comment
    await expect(commentACard.locator('.mod-options i, button.ion-trash-a, i.ion-trash-a, [class*="trash"]')).toHaveCount(0);

    // And user B should see the delete control for their own comment
    await expect(commentBCard.locator('.mod-options i, button.ion-trash-a, i.ion-trash-a, [class*="trash"]')).toBeVisible();
  });
});