import { test, expect } from '@playwright/test';
import { newUser, newArticle, loginAs, apiCall, UI } from '../support/fixtures';

test.describe('Article page visibility and permissions', () => {
  test('unauthenticated visitors and other users have restricted permissions', async ({ page }) => {
    // Given an author creates an article and posts a comment on it
    const author = await newUser();
    const article = await newArticle(author);

    const authorCommentBody = 'Author initial comment ' + Date.now();
    await apiCall(`articles/${article.slug}/comments`, 'POST', {
      comment: { body: authorCommentBody },
    }, author.token);

    // When an unauthenticated visitor opens the article page
    await page.goto(`${UI}/#/article/${article.slug}`);

    // Then the visitor can see the article but cannot post a comment
    await expect(page.getByRole('heading', { level: 1 })).toContainText(article.title);
    await expect(page.getByText(article.body)).toBeVisible();
    await expect(page.getByRole('textbox', { name: 'Write a comment...' })).not.toBeVisible();
    await expect(page.getByRole('button', { name: 'Post Comment' })).not.toBeVisible();

    // When another logged-in user who is not the author opens the article page
    const reader = await newUser();
    await loginAs(page, reader);
    await page.goto(`${UI}/#/article/${article.slug}`);

    // Then the user does not see the controls to edit or delete the article
    await expect(page.getByRole('link', { name: /Edit Article/i })).not.toBeVisible();
    await expect(page.getByRole('button', { name: /Delete Article/i })).not.toBeVisible();

    // And the user does not see the delete control for the author's comment
    const authorCommentCard = page.locator('.card', { hasText: authorCommentBody });
    await expect(authorCommentCard).toBeVisible();
    await expect(authorCommentCard.locator('.mod-options')).not.toBeVisible();
    await expect(authorCommentCard.getByRole('button', { name: /delete/i })).not.toBeVisible();
    await expect(authorCommentCard.locator('i.ion-trash-a')).not.toBeVisible();

    // When this user posts a comment on the article
    const readerCommentBody = 'Reader comment ' + Date.now();
    await page.getByRole('textbox', { name: 'Write a comment...' }).fill(readerCommentBody);
    await page.getByRole('button', { name: 'Post Comment' }).click();

    // Then the user sees the delete control only for their own comment
    const readerCommentCard = page.locator('.card', { hasText: readerCommentBody });
    await expect(readerCommentCard).toBeVisible();
    await expect(readerCommentCard.locator('.mod-options, .ion-trash-a')).toBeVisible();

    // Verify again that author's comment still has no delete control
    await expect(authorCommentCard.locator('.mod-options, .ion-trash-a')).not.toBeVisible();
  });
});