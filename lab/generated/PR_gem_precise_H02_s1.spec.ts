import { test, expect } from '@playwright/test';
import { newUser, newArticle, loginAs, apiCall, UI } from '../support/fixtures';

test.describe('Conduit Acceptance Tests', () => {
  test('Article page visibility and permissions (@item:H02)', async ({ page }) => {
    // Given an author creates an article and posts a comment on it
    const author = await newUser();
    const article = await newArticle(author);

    const authorCommentBody = 'Author comment ' + Date.now();
    await apiCall(`articles/${article.slug}/comments`, 'POST', {
      comment: { body: authorCommentBody },
    }, author.token);

    // When an unauthenticated guest views the article page
    await page.goto(`${UI}/#/article/${article.slug}`);

    // Then the guest can view the article but cannot post comments
    await expect(page.getByRole('heading', { name: article.title })).toBeVisible();
    await expect(page.getByText(article.body)).toBeVisible();
    await expect(page.getByRole('textbox', { name: 'Write a comment...' })).not.toBeVisible();
    await expect(page.getByRole('button', { name: 'Post Comment' })).not.toBeVisible();
    await expect(page.getByRole('link', { name: 'Sign in' }).first()).toBeVisible();

    // When another logged-in user who is not the author views the same article page
    const reader = await newUser();
    await loginAs(page, reader);
    await page.goto(`${UI}/#/article/${article.slug}`);

    // Then this user does not see controls to edit or delete the article
    await expect(page.getByRole('button', { name: /Delete Article/ })).not.toBeVisible();
    await expect(page.getByRole('link', { name: /Edit Article/ })).not.toBeVisible();

    // When this user posts their own comment on the article
    const readerCommentBody = 'Reader comment ' + Date.now();
    await page.getByRole('textbox', { name: 'Write a comment...' }).fill(readerCommentBody);
    await page.getByRole('button', { name: 'Post Comment' }).click();

    // Wait for reader's comment to appear
    await expect(page.getByText(readerCommentBody)).toBeVisible();

    // Then delete controls for comments only appear to the respective authors of those comments
    // Reader should see delete control on their own comment card, but not on author's comment card
    const readerCommentCard = page.locator('.card').filter({ hasText: readerCommentBody });
    const authorCommentCard = page.locator('.card').filter({ hasText: authorCommentBody });

    await expect(readerCommentCard.locator('.mod-options')).toBeVisible();
    await expect(authorCommentCard.locator('.mod-options')).not.toBeVisible();
  });
});