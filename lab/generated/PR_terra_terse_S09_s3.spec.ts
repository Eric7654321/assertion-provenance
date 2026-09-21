import { expect, test } from '@playwright/test';
import {
  apiCall,
  loginAs,
  newArticle,
  newUser,
  UI,
} from '../support/fixtures';

test.describe('Conduit Acceptance Tests', () => {
  test('@item:S09 Visibility of comment deletion', async ({ page }) => {
    const userA = await newUser();
    const userB = await newUser();
    const article = await newArticle(userA);

    const commentA = await apiCall(
      `/articles/${article.slug}/comments`,
      'POST',
      { comment: { body: 'Comment written by user A' } },
      userA.token,
    );
    expect(commentA.status).toBe(200);

    await loginAs(page, userB);
    await page.goto(`${UI}/#/article/${article.slug}`);

    const commentInput = page.locator('textarea[placeholder="Write a comment..."]');
    await expect(commentInput).toBeVisible();

    await commentInput.fill('Comment written by user B');
    await page.getByRole('button', { name: 'Post Comment' }).click();

    await expect(page.getByText('Comment written by user A')).toBeVisible();
    await expect(page.getByText('Comment written by user B')).toBeVisible();

    const userAComment = page
      .locator('.card')
      .filter({ hasText: 'Comment written by user A' });
    const userBComment = page
      .locator('.card')
      .filter({ hasText: 'Comment written by user B' });

    await expect(userAComment.getByRole('button')).toHaveCount(0);
    await expect(userBComment.getByRole('button')).toHaveCount(1);
  });
});