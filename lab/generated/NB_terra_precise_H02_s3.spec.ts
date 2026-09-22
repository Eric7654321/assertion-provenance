import { test, expect } from '@playwright/test';
import { newUser, newArticle, loginAs, UI } from '../support/fixtures';

test.describe('Conduit Acceptance Tests', () => {
  test('Article page visibility and permissions', async ({ page }) => {
    const author = await newUser();
    const article = await newArticle(author);

    await loginAs(page, author);
    await page.goto(`${UI}/#/article/${article.slug}`);

    const authorComment = 'Comment posted by the article author';
    await page.getByPlaceholder('Write a comment...').fill(authorComment);
    await page.getByRole('button', { name: 'Post Comment' }).click();

    await expect(page.getByText(authorComment)).toBeVisible();

    await page.context().clearCookies();
    await page.goto(`${UI}/#/article/${article.slug}`);

    await expect(page.getByRole('heading', { name: article.title })).toBeVisible();
    await expect(page.getByText(authorComment)).toBeVisible();
    await expect(page.getByPlaceholder('Write a comment...')).not.toBeVisible();
    await expect(page.getByRole('button', { name: 'Post Comment' })).not.toBeVisible();

    const otherUser = await newUser();
    await loginAs(page, otherUser);
    await page.goto(`${UI}/#/article/${article.slug}`);

    await expect(page.getByRole('heading', { name: article.title })).toBeVisible();
    await expect(page.getByRole('link', { name: /edit article/i })).not.toBeVisible();
    await expect(page.getByRole('button', { name: /delete article/i })).not.toBeVisible();

    const authorCommentCard = page.locator('.card', {
      hasText: authorComment,
    });
    await expect(authorCommentCard.locator('button')).toHaveCount(0);

    const otherComment = 'Comment posted by another user';
    await page.getByPlaceholder('Write a comment...').fill(otherComment);
    await page.getByRole('button', { name: 'Post Comment' }).click();

    const otherCommentCard = page.locator('.card', {
      hasText: otherComment,
    });

    await expect(otherCommentCard).toBeVisible();
    await expect(otherCommentCard.locator('button')).toHaveCount(1);
    await expect(authorCommentCard.locator('button')).toHaveCount(0);
  });
});