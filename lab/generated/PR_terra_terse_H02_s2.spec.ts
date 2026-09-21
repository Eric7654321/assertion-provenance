import { expect, test } from '@playwright/test';
import {
  apiCall,
  loginAs,
  newArticle,
  newUser,
  UI,
} from '../support/fixtures';

test.describe('Conduit Acceptance Requirements', () => {
  test('@item:H02 Article page visibility and permissions', async ({ page }) => {
    const author = await newUser();
    const otherUser = await newUser();
    const article = await newArticle(author);

    const authorComment = `Author comment ${Date.now()}`;
    const otherComment = `Other user comment ${Date.now()}`;

    const createComment = await apiCall(
      `/articles/${article.slug}/comments`,
      'POST',
      { comment: { body: authorComment } },
      author.token,
    );

    expect(createComment.status).toBe(200);

    await test.step('guest sees article content and unauthenticated actions', async () => {
      await page.goto(`${UI}/#/article/${article.slug}`);

      await expect(page.getByRole('heading', { name: article.title })).toBeVisible();
      await expect(page.getByText(article.description)).toBeVisible();
      await expect(page.getByText(authorComment)).toBeVisible();

      await expect(
        page.getByText('Sign in or sign up to add comments on this article.'),
      ).toBeVisible();

      await expect(
        page.getByRole('button', { name: /edit article/i }),
      ).toHaveCount(0);
      await expect(
        page.getByRole('button', { name: /delete article/i }),
      ).toHaveCount(0);
      await expect(
        page.getByRole('button', { name: /delete comment/i }),
      ).toHaveCount(0);
    });

    await test.step('non-author sees article content and non-author actions', async () => {
      await loginAs(page, otherUser);
      await page.goto(`${UI}/#/article/${article.slug}`);

      await expect(page.getByRole('heading', { name: article.title })).toBeVisible();
      await expect(page.getByText(authorComment)).toBeVisible();

      await expect(
        page.getByRole('button', { name: /edit article/i }),
      ).toHaveCount(0);
      await expect(
        page.getByRole('button', { name: /delete article/i }),
      ).toHaveCount(0);
      await expect(
        page.getByRole('button', { name: /delete comment/i }),
      ).toHaveCount(0);

      await expect(
        page.getByPlaceholder(/write a comment/i),
      ).toBeVisible();
      await expect(
        page.getByRole('button', { name: /post comment/i }),
      ).toBeVisible();
    });

    await test.step('non-author posts a comment and only receives permissions for their own comment', async () => {
      const commentBox = page.getByPlaceholder(/write a comment/i);
      await commentBox.fill(otherComment);
      await page.getByRole('button', { name: /post comment/i }).click();

      const otherCommentCard = page
        .locator('.card')
        .filter({ hasText: otherComment });

      await expect(otherCommentCard).toBeVisible();
      await expect(page.getByText(authorComment)).toBeVisible();

      await expect(
        otherCommentCard.getByRole('button', { name: /delete comment/i }),
      ).toBeVisible();

      const authorCommentCard = page
        .locator('.card')
        .filter({ hasText: authorComment });

      await expect(
        authorCommentCard.getByRole('button', { name: /delete comment/i }),
      ).toHaveCount(0);

      await expect(
        page.getByRole('button', { name: /edit article/i }),
      ).toHaveCount(0);
      await expect(
        page.getByRole('button', { name: /delete article/i }),
      ).toHaveCount(0);
    });
  });
});