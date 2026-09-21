import { test, expect } from '@playwright/test';
import { newUser, newArticle, loginAs, apiCall, UI } from '../support/fixtures';

test.describe('Conduit Acceptance Requirements', () => {
  test('Comment deletion visibility', async ({ page }) => {
    // Given User A and User B exist
    const userA = await newUser();
    const userB = await newUser();

    // Create an article (e.g. by userA)
    const article = await newArticle(userA);

    // User A leaves a comment on the article
    const commentAText = `Comment by User A ${Date.now()}`;
    await apiCall(`/articles/${article.slug}/comments`, 'POST', {
      comment: { body: commentAText }
    }, userA.token);

    // When User B opens the same article and leaves their own comment
    await loginAs(page, userB);
    await page.goto(`${UI}/#/article/${article.slug}`);

    const commentBText = `Comment by User B ${Date.now()}`;
    await page.getByRole('textbox', { name: 'Write a comment...' }).fill(commentBText);
    await page.getByRole('button', { name: 'Post Comment' }).click();

    // Wait for both comments to be visible
    await expect(page.locator('.card', { hasText: commentAText })).toBeVisible();
    await expect(page.locator('.card', { hasText: commentBText })).toBeVisible();

    // Then deleting a comment should only be possible for one's own comment
    const cardA = page.locator('.card', { hasText: commentAText });
    const cardB = page.locator('.card', { hasText: commentBText });

    // User B should NOT see the delete button/icon for User A's comment
    await expect(cardA.locator('.mod-options, .ion-trash-a, [aria-label*="delete" i], button i.fa-trash, .fa-trash, .fa-trash-alt')).toHaveCount(0);

    // User B SHOULD see the delete option for User B's comment
    const deleteButtonB = cardB.locator('.mod-options, .ion-trash-a, [aria-label*="delete" i], button i.fa-trash, .fa-trash, .fa-trash-alt');
    await expect(deleteButtonB.first()).toBeVisible();
  });
});