import { test, expect } from '@playwright/test';
import { newUser, newArticle, loginAs, apiCall, UI } from '../support/fixtures';

test.describe('Conduit Acceptance Tests', () => {
  test('@item:H02 Article page visibility and permissions', async ({ page }) => {
    // Given an author creates an article and posts a comment on it
    const author = await newUser();
    const article = await newArticle(author);

    const commentTextAuthor = 'Author comment ' + Date.now();
    await apiCall(
      `/articles/${article.slug}/comments`,
      'POST',
      { comment: { body: commentTextAuthor } },
      author.token
    );

    // When an unauthenticated visitor opens the article page
    await page.goto(`${UI}/#/article/${article.slug}`);

    // Then the visitor can see the article but cannot post a comment
    await expect(page.locator('h1')).toHaveText(article.title);
    await expect(page.locator('.article-content')).toContainText(article.body);
    // Unauthenticated user should see sign in / sign up prompt instead of comment form
    await expect(page.locator('textarea[placeholder="Write a comment..."]')).toHaveCount(0);
    await expect(page.locator('text=Sign in or sign up to add comments on this article')).toBeVisible();

    // When another logged-in user who is not the author opens the article page
    const reader = await newUser();
    await loginAs(page, reader);
    await page.goto(`${UI}/#/article/${article.slug}`);

    // Then the user does not see the controls to edit or delete the article
    await expect(page.locator('a:has-text("Edit Article")')).toHaveCount(0);
    await expect(page.locator('button:has-text("Delete Article")')).toHaveCount(0);

    // And the user does not see the delete control for the author's comment
    const authorCommentCard = page.locator('.card', { hasText: commentTextAuthor });
    await expect(authorCommentCard).toBeVisible();
    await expect(authorCommentCard.locator('.mod-options i, .ion-trash-a, [aria-label="Delete Comment"]')).toHaveCount(0);

    // When this user posts a comment on the article
    const readerCommentText = 'Reader comment ' + Date.now();
    await page.fill('textarea[placeholder="Write a comment..."]', readerCommentText);
    await page.click('button:has-text("Post Comment")');

    // Then the user sees the delete control only for their own comment
    const readerCommentCard = page.locator('.card', { hasText: readerCommentText });
    await expect(readerCommentCard).toBeVisible();
    await expect(
      readerCommentCard.locator('.mod-options i, .ion-trash-a, [aria-label="Delete Comment"]')
    ).toHaveCount(1);

    // Confirm author's comment still has no delete control
    await expect(
      authorCommentCard.locator('.mod-options i, .ion-trash-a, [aria-label="Delete Comment"]')
    ).toHaveCount(0);
  });
});