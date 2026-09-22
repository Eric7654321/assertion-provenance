import { test, expect } from '@playwright/test';
import { newUser, newArticle, loginAs, apiCall, UI } from '../support/fixtures';

test.describe('Conduit Acceptance Tests', () => {
  test('Visibility of comment deletion control', async ({ page }) => {
    // Given User A has posted a comment on an article
    const userA = await newUser();
    const userB = await newUser();

    const article = await newArticle(userA);

    await apiCall(
      `/articles/${article.slug}/comments`,
      'POST',
      { comment: { body: "Comment by User A" } },
      userA.token
    );

    // When User B views the same article and posts their own comment
    await loginAs(page, userB);
    await page.goto(`${UI}/#/article/${article.slug}`);

    const userAComment = page.locator('.card', { hasText: "Comment by User A" });
    await expect(userAComment).toBeVisible();

    await page.fill('textarea[placeholder*="comment" i]', "Comment by User B");
    await page.click('button:has-text("Post Comment")');

    const userBComment = page.locator('.card', { hasText: "Comment by User B" });
    await expect(userBComment).toBeVisible();

    // Then User B does not see the delete control for User A's comment
    await expect(userAComment.locator('.mod-options, .ion-trash-a, [data-testid="delete-comment"]')).not.toBeVisible();

    // And User B sees the delete control for their own comment
    await expect(userBComment.locator('.mod-options, .ion-trash-a, [data-testid="delete-comment"]')).toBeVisible();
  });
});