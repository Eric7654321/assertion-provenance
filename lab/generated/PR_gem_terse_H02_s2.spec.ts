import { test, expect } from '@playwright/test';
import { newUser, newArticle, loginAs, apiCall, UI } from '../support/fixtures';

test.describe('Article page visibility and permissions', () => {
  test('guest, author, and non-author user role-based permissions and visibility', async ({ page }) => {
    // Given a user creates an article and posts a comment under the article as its author
    const author = await newUser();
    const article = await newArticle(author);

    const authorCommentText = `Author comment ${Date.now()}`;
    const commentRes = await apiCall(`articles/${article.slug}/comments`, 'POST', {
      comment: { body: authorCommentText },
    }, author.token);
    expect(commentRes.status).toBe(200);

    // When a guest who is not logged in opens the article page
    await page.goto(`${UI}/#/article/${article.slug}`);

    // Then the guest should see content and available actions appropriate for an unauthenticated visitor
    // Guest sees article content and author's comment
    await expect(page.getByText(article.body)).toBeVisible();
    await expect(page.getByText(authorCommentText)).toBeVisible();

    // Guest should NOT see Edit / Delete Article buttons
    await expect(page.getByRole('link', { name: /Edit Article/i })).not.toBeVisible();
    await expect(page.getByRole('button', { name: /Delete Article/i })).not.toBeVisible();

    // Guest should NOT see the comment input box, but sees sign in / sign up prompt
    await expect(page.getByPlaceholder('Write a comment...')).not.toBeVisible();
    await expect(page.getByRole('link', { name: 'Sign in', exact: true })).toBeVisible();
    await expect(page.getByRole('link', { name: 'Sign up', exact: true })).toBeVisible();

    // When another logged-in user who is not the author opens the same article page
    const reader = await newUser();
    await loginAs(page, reader);
    await page.goto(`${UI}/#/article/${article.slug}`);

    // Then that user should see content and available actions appropriate for a non-author logged-in user
    await expect(page.getByText(article.body)).toBeVisible();
    await expect(page.getByText(authorCommentText)).toBeVisible();

    // Non-author should NOT see Edit / Delete Article buttons
    await expect(page.getByRole('link', { name: /Edit Article/i })).not.toBeVisible();
    await expect(page.getByRole('button', { name: /Delete Article/i })).not.toBeVisible();

    // Non-author CAN see the comment textarea and Post Comment button
    const commentInput = page.getByPlaceholder('Write a comment...');
    await expect(commentInput).toBeVisible();
    await expect(page.getByRole('button', { name: 'Post Comment' })).toBeVisible();

    // When that user posts their own comment on the same page
    const readerCommentText = `Reader comment ${Date.now()}`;
    await commentInput.fill(readerCommentText);
    await page.getByRole('button', { name: 'Post Comment' }).click();

    // Then the displayed content and available actions should reflect different roles on the same page
    // Both comments should be visible
    await expect(page.getByText(authorCommentText)).toBeVisible();
    await expect(page.getByText(readerCommentText)).toBeVisible();

    // Reader can delete their own comment, but cannot delete author's comment
    const readerCommentCard = page.locator('.card', { hasText: readerCommentText });
    await expect(readerCommentCard.locator('.mod-options i, .ion-trash-a')).toBeVisible();

    const authorCommentCard = page.locator('.card', { hasText: authorCommentText });
    await expect(authorCommentCard.locator('.mod-options i, .ion-trash-a')).not.toBeVisible();
  });
});