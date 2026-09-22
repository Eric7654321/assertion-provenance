import { test, expect } from '@playwright/test';
import {
  newUser,
  newArticle,
  loginAs,
  apiCall,
  UI,
} from '../support/fixtures';

test.describe('Conduit Acceptance Tests', () => {
  test('@item:H02 Article page visibility and permissions', async ({ page }) => {
    const author = await newUser();
    const otherUser = await newUser();
    const article = await newArticle(author);

    const authorCommentBody = 'Comment written by the article author';
    const otherCommentBody = 'Comment written by another user';

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

    await expect(page.locator('textarea[placeholder="Write a comment..."]')).toHaveCount(0);
    await expect(page.getByRole('button', { name: /post comment/i })).toHaveCount(0);

    await loginAs(page, otherUser);
    await page.goto(`${UI}/#/article/${article.slug}`);

    await expect(page.getByRole('heading', { name: article.title })).toBeVisible();
    await expect(page.getByRole('link', { name: /edit article/i })).toHaveCount(0);
    await expect(page.getByRole('button', { name: /delete article/i })).toHaveCount(0);

    const commentBox = page.locator('textarea[placeholder="Write a comment..."]');
    await expect(commentBox).toBeVisible();

    await commentBox.fill(otherCommentBody);
    await page.getByRole('button', { name: /post comment/i }).click();

    const authorComment = page.locator('.card', {
      hasText: authorCommentBody,
    });
    const otherUserComment = page.locator('.card', {
      hasText: otherCommentBody,
    });

    await expect(authorComment).toBeVisible();
    await expect(otherUserComment).toBeVisible();

    await expect(authorComment.locator('button')).toHaveCount(0);
    await expect(otherUserComment.locator('button')).toHaveCount(1);
  });
});