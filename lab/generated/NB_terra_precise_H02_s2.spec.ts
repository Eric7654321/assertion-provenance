import { test, expect } from '@playwright/test';
import {
  newUser,
  newArticle,
  loginAs,
  apiCall,
  UI,
} from '../support/fixtures';

test.describe('Conduit Acceptance Criteria', () => {
  test('H02: Article page visibility and permissions', async ({ page }) => {
    const author = await newUser();
    const article = await newArticle(author);
    const visitor = await newUser();

    const authorComment = await apiCall(
      `/articles/${article.slug}/comments`,
      'POST',
      { comment: { body: 'Comment written by the article author' } },
      author.token,
    );

    expect(authorComment.status).toBe(200);

    await page.goto(`${UI}/#/article/${article.slug}`);

    await expect(page.getByRole('heading', { name: article.title })).toBeVisible();
    await expect(page.locator('textarea[placeholder="Write a comment..."]')).toHaveCount(0);
    await expect(page.getByText('Sign in or sign up to add comments on this article.')).toBeVisible();

    await loginAs(page, visitor);
    await page.goto(`${UI}/#/article/${article.slug}`);

    await expect(page.getByRole('heading', { name: article.title })).toBeVisible();
    await expect(page.getByRole('button', { name: /edit article/i })).toHaveCount(0);
    await expect(page.getByRole('button', { name: /delete article/i })).toHaveCount(0);

    const visitorCommentBody = 'Comment written by another user';
    await page.locator('textarea[placeholder="Write a comment..."]').fill(visitorCommentBody);
    await page.getByRole('button', { name: /post comment/i }).click();

    const authorCommentCard = page.locator('.card', {
      hasText: 'Comment written by the article author',
    });
    const visitorCommentCard = page.locator('.card', {
      hasText: visitorCommentBody,
    });

    await expect(authorCommentCard).toBeVisible();
    await expect(visitorCommentCard).toBeVisible();

    await expect(authorCommentCard.locator('button')).toHaveCount(0);
    await expect(visitorCommentCard.locator('button')).toHaveCount(1);
  });
});