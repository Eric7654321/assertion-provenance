import { test, expect } from '@playwright/test';
import {
  newUser,
  newArticle,
  loginAs,
  apiCall,
  UI,
} from '../support/fixtures';

test.describe('Conduit Acceptance Tests', () => {
  test('@item:S09 User B only sees delete control for their own comment', async ({
    page,
  }) => {
    const userA = await newUser();
    const userB = await newUser();
    const article = await newArticle(userA);

    const commentA = await apiCall(
      `/articles/${article.slug}/comments`,
      'POST',
      { comment: { body: 'Comment written by User A' } },
      userA.token,
    );

    expect(commentA.status).toBe(200);

    await loginAs(page, userB);
    await page.goto(`${UI}/#/article/${article.slug}`);

    const commentInput = page.locator('textarea[placeholder="Write a comment..."]');
    await expect(commentInput).toBeVisible();

    await commentInput.fill('Comment written by User B');
    await page.getByRole('button', { name: 'Post Comment' }).click();

    const userAComment = page
      .locator('.card')
      .filter({ hasText: 'Comment written by User A' });
    const userBComment = page
      .locator('.card')
      .filter({ hasText: 'Comment written by User B' });

    await expect(userAComment).toBeVisible();
    await expect(userBComment).toBeVisible();

    await expect(
      userAComment.getByRole('button', { name: /delete/i }),
    ).toHaveCount(0);

    await expect(
      userBComment.getByRole('button', { name: /delete/i }),
    ).toBeVisible();
  });
});