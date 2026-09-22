import { test, expect } from '@playwright/test';
import {
  newUser,
  newArticle,
  loginAs,
  apiCall,
  UI,
} from '../support/fixtures';

test.describe('Conduit Acceptance Tests', () => {
  test('@item:S09 Comment deletion visibility', async ({ page }) => {
    const userA = await newUser();
    const userB = await newUser();
    const article = await newArticle(userA);

    const commentA = 'Comment posted by user A';
    const commentB = 'Comment posted by user B';

    const postCommentA = await apiCall(
      `/articles/${article.slug}/comments`,
      'POST',
      { comment: { body: commentA } },
      userA.token,
    );
    expect(postCommentA.status).toBe(200);

    await loginAs(page, userB);
    await page.goto(`${UI}/#/article/${article.slug}`);

    const commentInput = page.locator('textarea[placeholder="Write a comment..."]');
    await expect(commentInput).toBeVisible();
    await commentInput.fill(commentB);
    await page.getByRole('button', { name: /post comment/i }).click();

    const userAComment = page.locator('.card', { hasText: commentA });
    const userBComment = page.locator('.card', { hasText: commentB });

    await expect(userAComment).toBeVisible();
    await expect(userBComment).toBeVisible();

    await expect(userAComment.locator('button')).toHaveCount(0);
    await expect(userBComment.locator('button')).toHaveCount(1);
  });
});