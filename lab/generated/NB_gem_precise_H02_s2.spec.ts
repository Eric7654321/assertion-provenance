import { test, expect } from '@playwright/test';
import { newUser, newArticle, loginAs, apiCall, UI } from '../support/fixtures';

test.describe('Conduit Acceptance Criteria', () => {
  test('Article page visibility and permissions (@item:H02)', async ({ page }) => {
    // Given an author creates an article and leaves a comment on it
    const author = await newUser();
    const article = await newArticle(author);

    const authorCommentBody = 'Author original comment ' + Date.now();
    await apiCall(`/articles/${article.slug}/comments`, 'POST', {
      comment: { body: authorCommentBody }
    }, author.token);

    const articleUrl = `${UI}/#/article/${article.slug}`;

    // When an unauthenticated visitor opens the article page
    await page.goto(articleUrl);

    // Then the visitor can see the article but cannot leave a comment
    await expect(page.getByRole('heading', { name: article.title })).toBeVisible();
    await expect(page.getByText(article.body)).toBeVisible();
    // Unauthenticated user sees prompt to sign in / sign up instead of the comment form
    await expect(page.locator('form.comment-form')).toHaveCount(0);
    await expect(page.getByText(/sign in.*or.*sign up.*to add comments/i)).toBeVisible();

    // When another logged-in user who is not the author opens the article page
    const reader = await newUser();
    await loginAs(page, reader);
    await page.goto(articleUrl);

    // Then the user should not see the edit and delete controls for the article
    await expect(page.locator('.article-actions, .banner').locator('a[href*="#/editor/"]')).toHaveCount(0);
    await expect(page.locator('.article-actions, .banner').getByRole('button', { name: /delete article/i })).toHaveCount(0);

    // When this user leaves their own comment on the article page
    const readerCommentBody = 'Reader comment ' + Date.now();
    await page.locator('form.comment-form textarea').fill(readerCommentBody);
    await page.locator('form.comment-form button[type="submit"]').click();

    // Ensure reader's comment is visible
    const readerCommentCard = page.locator('.card', { hasText: readerCommentBody });
    await expect(readerCommentCard).toBeVisible();

    // Then the delete control for a comment should only appear to the author of that comment
    const authorCommentCard = page.locator('.card', { hasText: authorCommentBody });
    await expect(authorCommentCard).toBeVisible();

    // Delete control (.mod-options or trash icon) should be visible on reader's comment, but NOT on author's comment
    await expect(readerCommentCard.locator('.mod-options, .ion-trash-a, i.ion-trash-b, button:has-text("Delete")')).toBeVisible();
    await expect(authorCommentCard.locator('.mod-options, .ion-trash-a, i.ion-trash-b, button:has-text("Delete")')).toHaveCount(0);
  });
});