import { test, expect } from '@playwright/test';
import {
  newUser,
  newArticle,
  loginAs,
  apiCall,
  UI,
} from '../support/fixtures';

test.describe('Conduit Acceptance Criteria', () => {
  test('S09 - Comment deletion control visibility', async ({ page }) => {
    const userA = await newUser();
    const userB = await newUser();
    const article = await newArticle(userA);

    const commentBodyA = 'Comment written by user A';
    const commentBodyB = 'Comment written by user B';

    const createComment = await apiCall(
      `/articles/${article.slug}/comments`,
      'POST',
      { comment: { body: commentBodyA } },
      userA.token,
    );

    expect(createComment.status).toBe(200);

    await loginAs(page, userB);
    await page.goto(`${UI}/#/article/${article.slug}`);

    await expect(page.locator('.comment-card').filter({ hasText: commentBodyA })).toBeVisible();

    await page.locator('textarea[placeholder="Write a comment..."]').fill(commentBodyB);
    await page.getByRole('button', { name: /post comment/i }).click();

    const userAComment = page.locator('.comment-card').filter({ hasText: commentBodyA });
    const userBComment = page.locator('.comment-card').filter({ hasText: commentBodyB });

    await expect(userBComment).toBeVisible();

    await expect(userAComment.locator('button')).toHaveCount(0);
    await expect(userBComment.locator('button')).toHaveCount(1);
  });
});