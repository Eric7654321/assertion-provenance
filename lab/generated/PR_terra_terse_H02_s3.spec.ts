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
    const visitor = await newUser();
    const article = await newArticle(author);

    const authorComment = await apiCall(
      `/articles/${article.slug}/comments`,
      'POST',
      { comment: { body: 'Comment written by the article author.' } },
      author.token,
    );

    expect(authorComment.status).toBe(200);

    await page.goto(`${UI}/#/article/${article.slug}`);

    await expect(page.getByRole('heading', { name: article.title })).toBeVisible();
    await expect(page.getByText(article.description)).toBeVisible();
    await expect(
      page.getByText('Comment written by the article author.'),
    ).toBeVisible();

    await expect(
      page.getByRole('link', { name: /sign in or sign up to add comments/i }),
    ).toBeVisible();

    await expect(
      page.getByRole('button', { name: /edit article/i }),
    ).toHaveCount(0);
    await expect(
      page.getByRole('button', { name: /delete article/i }),
    ).toHaveCount(0);
    await expect(page.getByRole('button', { name: /delete/i })).toHaveCount(0);

    await loginAs(page, visitor);
    await page.goto(`${UI}/#/article/${article.slug}`);

    await expect(page.getByRole('heading', { name: article.title })).toBeVisible();
    await expect(
      page.getByText('Comment written by the article author.'),
    ).toBeVisible();

    await expect(
      page.getByPlaceholder(/write a comment/i),
    ).toBeVisible();

    await expect(
      page.getByRole('link', { name: /sign in or sign up to add comments/i }),
    ).toHaveCount(0);

    await expect(
      page.getByRole('button', { name: /edit article/i }),
    ).toHaveCount(0);
    await expect(
      page.getByRole('button', { name: /delete article/i }),
    ).toHaveCount(0);

    const commentBody = 'Comment written by another logged-in user.';
    await page.getByPlaceholder(/write a comment/i).fill(commentBody);
    await page.getByRole('button', { name: /post comment/i }).click();

    await expect(page.getByText(commentBody)).toBeVisible();

    const ownComment = page
      .locator('.card')
      .filter({ hasText: commentBody });

    await expect(ownComment.getByRole('button', { name: /delete/i })).toBeVisible();

    const authorCommentCard = page
      .locator('.card')
      .filter({ hasText: 'Comment written by the article author.' });

    await expect(
      authorCommentCard.getByRole('button', { name: /delete/i }),
    ).toHaveCount(0);
  });
});