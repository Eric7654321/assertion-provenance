import { test, expect } from '@playwright/test';
import {
  newUser,
  newArticle,
  loginAs,
  apiCall,
  UI,
} from '../support/fixtures';

test.describe('Conduit Acceptance Requirements', () => {
  test('@item:H02 Article page visibility and permissions', async ({ page }) => {
    const author = await newUser();
    const visitor = await newUser();
    const article = await newArticle(author);

    const authorComment = 'Comment written by the article author';
    const visitorComment = 'Comment written by another logged-in user';

    const createAuthorComment = await apiCall(
      `/articles/${article.slug}/comments`,
      'POST',
      { comment: { body: authorComment } },
      author.token,
    );
    expect(createAuthorComment.status).toBe(200);

    await page.goto(`${UI}/#/article/${article.slug}`);

    await expect(page.getByText(article.title, { exact: true })).toBeVisible();
    await expect(page.getByText(author.username, { exact: true }).first()).toBeVisible();
    await expect(page.getByText(authorComment, { exact: true })).toBeVisible();

    await expect(
      page.getByRole('button', { name: /delete article/i }),
    ).toHaveCount(0);
    await expect(
      page.getByRole('link', { name: /edit article/i }),
    ).toHaveCount(0);
    await expect(
      page.getByRole('button', { name: /delete comment/i }),
    ).toHaveCount(0);
    await expect(
      page.getByPlaceholder(/write a comment/i),
    ).toHaveCount(0);

    await loginAs(page, visitor);
    await page.goto(`${UI}/#/article/${article.slug}`);

    await expect(page.getByText(article.title, { exact: true })).toBeVisible();
    await expect(page.getByText(authorComment, { exact: true })).toBeVisible();

    await expect(
      page.getByRole('button', { name: /delete article/i }),
    ).toHaveCount(0);
    await expect(
      page.getByRole('link', { name: /edit article/i }),
    ).toHaveCount(0);
    await expect(
      page.getByRole('button', { name: /delete comment/i }),
    ).toHaveCount(0);

    const commentInput = page.getByPlaceholder(/write a comment/i);
    await expect(commentInput).toBeVisible();
    await commentInput.fill(visitorComment);
    await page.getByRole('button', { name: /post comment/i }).click();

    const visitorCommentCard = page
      .locator('.card')
      .filter({ hasText: visitorComment });

    await expect(visitorCommentCard).toBeVisible();
    await expect(visitorCommentCard.getByText(visitor.username, { exact: true })).toBeVisible();
    await expect(
      visitorCommentCard.getByRole('button', { name: /delete comment/i }),
    ).toBeVisible();

    const authorCommentCard = page
      .locator('.card')
      .filter({ hasText: authorComment });

    await expect(authorCommentCard).toBeVisible();
    await expect(
      authorCommentCard.getByRole('button', { name: /delete comment/i }),
    ).toHaveCount(0);
  });
});