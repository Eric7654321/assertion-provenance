import { test, expect } from '@playwright/test';
import { newUser, newArticle, loginAs, apiCall, UI } from '../support/fixtures';

test.describe('Conduit Acceptance Tests', () => {
  test('Article page visibility and permissions', async ({ page }) => {
    // Given an author creates an article and posts a comment on it
    const author = await newUser();
    const article = await newArticle(author);

    const authorCommentBody = 'Author comment ' + Date.now();
    await apiCall(`/articles/${article.slug}/comments`, 'POST', {
      comment: { body: authorCommentBody }
    }, author.token);

    // When an unauthenticated guest views the article page
    await page.goto(`${UI}/#/article/${article.slug}`);

    // Then the guest can view the article but cannot post comments
    await expect(page.locator('h1')).toContainText(article.title);
    await expect(page.locator('.article-content')).toContainText(article.body);
    await expect(page.locator('textarea[placeholder="Write a comment..."]')).toHaveCount(0);
    await expect(page.locator('text=Sign in or sign up to add comments on this article.')).toBeVisible();

    // When another logged-in user who is not the author views the same article page
    const reader = await newUser();
    await loginAs(page, reader);
    await page.goto(`${UI}/#/article/${article.slug}`);

    // Then this user does not see controls to edit or delete the article
    await expect(page.locator('h1')).toContainText(article.title);
    await expect(page.locator('a[href*="/editor/"]')).toHaveCount(0);
    await expect(page.locator('button:has-text("Delete Article")')).toHaveCount(0);

    // When this user posts their own comment on the article
    const readerCommentBody = 'Reader comment ' + Date.now();
    await page.locator('textarea[placeholder="Write a comment..."]').fill(readerCommentBody);
    await page.locator('button:has-text("Post Comment")').click();

    // Then delete controls for comments only appear to the respective authors of those comments
    const authorCommentCard = page.locator('.card', { hasText: authorCommentBody });
    const readerCommentCard = page.locator('.card', { hasText: readerCommentBody });

    await expect(authorCommentCard).toBeVisible();
    await expect(readerCommentCard).toBeVisible();

    // The reader should not see the delete button (trash icon / mod-options) on the author's comment
    await expect(authorCommentCard.locator('.mod-options')).toHaveCount(0);

    // The reader should see the delete button on their own comment
    await expect(readerCommentCard.locator('.mod-options')).toBeVisible();
  });
});