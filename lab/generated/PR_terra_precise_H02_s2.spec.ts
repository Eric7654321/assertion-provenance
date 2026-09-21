import { test, expect } from '@playwright/test';
import {
  newUser,
  newArticle,
  loginAs,
  apiCall,
  UI,
} from '../support/fixtures';

test.describe('Feature: Conduit Acceptance Criteria', () => {
  test('@item:H02 Article page visibility and permissions', async ({ page }) => {
    const author = await newUser();
    const visitor = await newUser();
    const article = await newArticle(author);

    const authorComment = await apiCall(
      `/articles/${article.slug}/comments`,
      'POST',
      { comment: { body: 'Comment written by the article author' } },
      author.token,
    );

    expect(authorComment.status).toBe(200);

    await page.goto(`${UI}/#/article/${article.slug}`);

    await expect(page.getByRole('heading', { name: article.title })).toBeVisible();
    await expect(
      page.getByText('Comment written by the article author'),
    ).toBeVisible();

    await expect(
      page.getByPlaceholder(/write a comment/i),
    ).not.toBeVisible();

    await expect(
      page.getByRole('button', { name: /edit article/i }),
    ).not.toBeVisible();
    await expect(
      page.getByRole('button', { name: /delete article/i }),
    ).not.toBeVisible();

    await loginAs(page, visitor);
    await page.goto(`${UI}/#/article/${article.slug}`);

    await expect(page.getByRole('heading', { name: article.title })).toBeVisible();
    await expect(
      page.getByRole('button', { name: /edit article/i }),
    ).not.toBeVisible();
    await expect(
      page.getByRole('button', { name: /delete article/i }),
    ).not.toBeVisible();

    const commentBox = page.getByPlaceholder(/write a comment/i);
    await expect(commentBox).toBeVisible();

    await commentBox.fill('Comment written by the other user');
    await page.getByRole('button', { name: /post comment/i }).click();

    const visitorComment = page
      .locator('.card')
      .filter({ hasText: 'Comment written by the other user' });

    await expect(visitorComment).toBeVisible();
    await expect(visitorComment.getByRole('button')).toBeVisible();

    const authorCommentCard = page
      .locator('.card')
      .filter({ hasText: 'Comment written by the article author' });

    await expect(authorCommentCard).toBeVisible();
    await expect(authorCommentCard.getByRole('button')).toHaveCount(0);
  });
});