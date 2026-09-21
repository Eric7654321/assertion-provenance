import { test, expect } from '@playwright/test';
import { newUser, newArticle, loginAs, apiCall, UI } from '../support/fixtures';

test.describe('Conduit Acceptance Tests', () => {
  test('Comment deletion visibility (@item:S09)', async ({ page }) => {
    // Given user A posts a comment on an article
    const userA = await newUser();
    const userB = await newUser();
    const article = await newArticle(userA);

    const commentAContent = `Comment by user A ${Date.now()}`;
    await apiCall(`/articles/${article.slug}/comments`, 'POST', {
      comment: { body: commentAContent },
    }, userA.token);

    // When user B opens the same article and posts their own comment
    await loginAs(page, userB);
    await page.goto(`${UI}/#/article/${article.slug}`);

    const commentBContent = `Comment by user B ${Date.now()}`;
    await page.getByRole('textbox', { name: 'Write a comment...' }).fill(commentBContent);
    await page.getByRole('button', { name: 'Post Comment' }).click();

    // Verify both comments are displayed
    const cardA = page.locator('.card', { hasText: commentAContent });
    const cardB = page.locator('.card', { hasText: commentBContent });

    await expect(cardA).toBeVisible();
    await expect(cardB).toBeVisible();

    // Then user B cannot see the delete control for user A's comment
    await expect(cardA.locator('.mod-options, .ion-trash-a, button.btn-outline-danger')).toHaveCount(0);

    // And user B can see the delete control for their own comment
    await expect(cardB.locator('.mod-options, .ion-trash-a, button.btn-outline-danger')).toBeVisible();
  });
});