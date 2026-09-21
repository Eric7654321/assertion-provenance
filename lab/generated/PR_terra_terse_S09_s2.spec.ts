import { test, expect } from '@playwright/test';
import {
  newUser,
  newArticle,
  loginAs,
  apiCall,
  UI,
} from '../support/fixtures';

test('S09: users can only delete their own comments', async ({ page }) => {
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

  await expect(page.getByText('Comment written by user B')).toBeVisible();
  await expect(page.getByText('Comment written by user A')).toBeVisible();

  const userAComment = page
    .locator('.card')
    .filter({ hasText: 'Comment written by user A' });

  const userBComment = page
    .locator('.card')
    .filter({ hasText: 'Comment written by user B' });

  await expect(userAComment.getByRole('button')).toHaveCount(0);
  await expect(userBComment.getByRole('button')).toHaveCount(1);

  await userBComment.getByRole('button').click();

  await expect(page.getByText('Comment written by user B')).toHaveCount(0);
  await expect(page.getByText('Comment written by user A')).toBeVisible();
});