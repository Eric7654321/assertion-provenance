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
    const article = await newArticle(author);
    const visitor = await newUser();

    const authorCommentBody = `Author comment ${Date.now()}`;
    const createComment = await apiCall(
      `/articles/${article.slug}/comments`,
      'POST',
      { comment: { body: authorCommentBody } },
      author.token,
    );

    expect(createComment.status).toBe(200);

    await page.goto(`${UI}/#/article/${article.slug}`);

    await expect(page.getByRole('heading', { name: article.title })).toBeVisible();
    await expect(page.getByText(authorCommentBody)).toBeVisible();
    await expect(
      page.getByPlaceholder('Write a comment...'),
    ).not.toBeVisible();

    await loginAs(page, visitor);
    await page.goto(`${UI}/#/article/${article.slug}`);

    await expect(page.getByRole('heading', { name: article.title })).toBeVisible();
    await expect(page.getByText(authorCommentBody)).toBeVisible();

    await expect(
      page.getByRole('link', { name: /edit article/i }),
    ).not.toBeVisible();
    await expect(
      page.getByRole('button', { name: /delete article/i }),
    ).not.toBeVisible();

    const authorComment = page
      .locator('.card')
      .filter({ hasText: authorCommentBody });

    await expect(
      authorComment.getByRole('button', { name: /delete/i }),
    ).not.toBeVisible();

    const visitorCommentBody = `Visitor comment ${Date.now()}`;
    const commentInput = page.getByPlaceholder('Write a comment...');

    await expect(commentInput).toBeVisible();
    await commentInput.fill(visitorCommentBody);
    await page.getByRole('button', { name: /post comment/i }).click();

    const visitorComment = page
      .locator('.card')
      .filter({ hasText: visitorCommentBody });

    await expect(visitorComment).toBeVisible();
    await expect(
      visitorComment.getByRole('button', { name: /delete/i }),
    ).toBeVisible();

    await expect(
      authorComment.getByRole('button', { name: /delete/i }),
    ).not.toBeVisible();
  });
});