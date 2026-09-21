import { test, expect } from '@playwright/test';
import { newUser, newArticle, loginAs, apiCall, UI } from '../support/fixtures';

test.describe('Article page visibility and permissions', () => {
  test('H02: Article page visibility and permissions', async ({ page }) => {
    // Given an author creates an article and leaves a comment on it
    const author = await newUser();
    const article = await newArticle(author, {
      title: 'Visibility Test Article',
      body: 'Content of the article for testing visibility and permissions.',
      description: 'Test description',
    });

    const authorCommentBody = 'Author first comment';
    await apiCall(`articles/${article.slug}/comments`, 'POST', {
      comment: { body: authorCommentBody },
    }, author.token);

    // When an unauthenticated visitor opens the article page
    await page.goto(`${UI}/#/article/${article.slug}`);

    // Then the visitor can see the article but cannot leave a comment
    await expect(page.getByRole('heading', { name: article.title })).toBeVisible();
    await expect(page.getByText(article.body)).toBeVisible();
    await expect(page.getByText(authorCommentBody)).toBeVisible();

    await expect(page.getByPlaceholder('Write a comment...')).not.toBeVisible();
    await expect(page.getByRole('button', { name: 'Post Comment' })).not.toBeVisible();
    await expect(page.getByRole('link', { name: 'Sign in' })).toBeVisible();

    // When another logged-in user who is not the author opens the article page
    const reader = await newUser();
    await loginAs(page, reader);
    await page.goto(`${UI}/#/article/${article.slug}`);

    // Then the user should not see the edit and delete controls for the article
    await expect(page.getByText(article.title)).toBeVisible();
    await expect(page.getByRole('link', { name: /Edit Article/i })).not.toBeVisible();
    await expect(page.getByRole('button', { name: /Delete Article/i })).not.toBeVisible();

    // When this user leaves their own comment on the article page
    const readerCommentBody = 'Reader comment on article';
    await page.getByPlaceholder('Write a comment...').fill(readerCommentBody);
    await page.getByRole('button', { name: 'Post Comment' }).click();

    // Then the delete control for a comment should only appear to the author of that comment
    await expect(page.getByText(readerCommentBody)).toBeVisible();

    // Find the comment card for the author's comment: reader should NOT see delete icon/button
    const authorCommentCard = page.locator('.card', { hasText: authorCommentBody });
    await expect(authorCommentCard).toBeVisible();
    await expect(authorCommentCard.locator('.ion-trash-a, .mod-options i, button:has(.ion-trash-a)')).toHaveCount(0);

    // Find the comment card for reader's own comment: reader SHOULD see delete icon/button
    const readerCommentCard = page.locator('.card', { hasText: readerCommentBody });
    await expect(readerCommentCard).toBeVisible();
    await expect(readerCommentCard.locator('.ion-trash-a, .mod-options i, button:has(.ion-trash-a)')).toHaveCount(1);
  });
});