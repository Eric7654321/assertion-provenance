import { test, expect } from '@playwright/test';
import { newArticle, newUser, loginAs, UI } from '../support/fixtures';

test.describe('Conduit Acceptance Criteria', () => {
  test('S09: user only sees delete control for their own comments', async ({ page }) => {
    const userA = await newUser();
    const userB = await newUser();
    const article = await newArticle(userA);

    await loginAs(page, userA);
    await page.goto(`${UI}/#/article/${article.slug}`);

    const commentA = 'Comment written by user A';
    await page.getByPlaceholder('Write a comment...').fill(commentA);
    await page.getByRole('button', { name: 'Post Comment' }).click();

    await expect(page.getByText(commentA)).toBeVisible();

    await loginAs(page, userB);
    await page.goto(`${UI}/#/article/${article.slug}`);

    const commentB = 'Comment written by user B';
    await page.getByPlaceholder('Write a comment...').fill(commentB);
    await page.getByRole('button', { name: 'Post Comment' }).click();

    const userAComment = page.locator('.card', { hasText: commentA });
    const userBComment = page.locator('.card', { hasText: commentB });

    await expect(userAComment).toBeVisible();
    await expect(userBComment).toBeVisible();

    await expect(userAComment.locator('button')).toHaveCount(0);
    await expect(userBComment.locator('button')).toHaveCount(1);
    await expect(userBComment.locator('button')).toHaveAttribute('aria-label', /delete/i);
  });
});