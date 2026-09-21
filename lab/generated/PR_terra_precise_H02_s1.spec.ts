import { expect, test } from '@playwright/test';
import {
  apiCall,
  loginAs,
  newArticle,
  newUser,
  UI,
} from '../support/fixtures';

test.describe('Conduit Acceptance Tests', () => {
  test('@item:H02 Article page visibility and permissions', async ({ page }) => {
    const author = await newUser();
    const otherUser = await newUser();
    const article = await newArticle(author);

    const authorCommentBody = `Author comment ${Date.now()}`;
    const otherCommentBody = `Other user comment ${Date.now()}`;

    const authorCommentResponse = await apiCall(
      `/articles/${article.slug}/comments`,
      'POST',
      { comment: { body: authorCommentBody } },
      author.token,
    );

    expect(authorCommentResponse.status).toBe(200);

    await page.goto(`${UI}/#/article/${article.slug}`);

    await expect(page.getByRole('heading', { name: article.title })).toBeVisible();
    await expect(page.getByText(authorCommentBody)).toBeVisible();
    await expect(page.getByPlaceholder('Write a comment...')).toHaveCount(0);
    await expect(page.getByRole('button', { name: /post comment/i })).toHaveCount(0);

    await loginAs(page, otherUser);
    await page.goto(`${UI}/#/article/${article.slug}`);

    await expect(page.getByRole('heading', { name: article.title })).toBeVisible();
    await expect(page.getByRole('link', { name: /edit article/i })).toHaveCount(0);
    await expect(page.getByRole('button', { name: /delete article/i })).toHaveCount(0);

    const commentInput = page.getByPlaceholder('Write a comment...');
    await expect(commentInput).toBeVisible();
    await commentInput.fill(otherCommentBody);
    await page.getByRole('button', { name: /post comment/i }).click();

    const authorComment = page.locator('.card').filter({ hasText: authorCommentBody });
    const otherComment = page.locator('.card').filter({ hasText: otherCommentBody });

    await expect(authorComment).toBeVisible();
    await expect(otherComment).toBeVisible();

    await expect(authorComment.getByRole('button')).toHaveCount(0);
    await expect(otherComment.getByRole('button')).toHaveCount(1);
  });
});