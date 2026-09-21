import { test, expect } from '@playwright/test';
import { newUser, newArticle, loginAs, apiCall, UI } from '../support/fixtures';

test.describe('Article page visibility and permissions', () => {
  test('H02: visibility and actions differ based on role', async ({ page }) => {
    // Given an author creates an article and leaves a comment on it
    const author = await newUser();
    const article = await newArticle(author);

    const authorCommentText = 'Author comment ' + Date.now();
    await apiCall(`articles/${article.slug}/comments`, 'POST', {
      comment: { body: authorCommentText },
    }, author.token);

    // When an unauthenticated visitor opens the article page
    await page.goto(`${UI}/#/article/${article.slug}`);

    // Then what is visible and the available actions differ based on the role
    // Unauthenticated visitor:
    // - Should see author's comment
    await expect(page.getByText(authorCommentText)).toBeVisible();
    // - Should NOT see Edit Article or Delete Article buttons
    await expect(page.getByRole('button', { name: /Delete Article/i })).toHaveCount(0);
    await expect(page.getByRole('link', { name: /Edit Article/i })).toHaveCount(0);
    // - Should NOT see comment textarea
    await expect(page.getByPlaceholder('Write a comment...')).toHaveCount(0);
    // - Should see prompt to sign in or sign up
    await expect(page.getByRole('link', { name: 'Sign in' }).first()).toBeVisible();
    await expect(page.getByText('to add comments on this article.')).toBeVisible();
    // - Should not see delete comment button
    await expect(page.locator('.ion-trash-a, .mod-options i, button i.ion-trash-a')).toHaveCount(0);

    // When another logged-in, non-author user opens the same page
    const reader = await newUser();
    await loginAs(page, reader);
    await page.goto(`${UI}/#/article/${article.slug}`);

    // And this user leaves their own comment on the page
    const readerCommentText = 'Reader comment ' + Date.now();
    await page.getByPlaceholder('Write a comment...').fill(readerCommentText);
    await page.getByRole('button', { name: 'Post Comment' }).click();

    // Then what is visible and the available actions differ based on the role
    // Non-author reader:
    // - Both comments should be visible
    await expect(page.getByText(authorCommentText)).toBeVisible();
    await expect(page.getByText(readerCommentText)).toBeVisible();

    // - Still should NOT see Edit or Delete Article buttons
    await expect(page.getByRole('button', { name: /Delete Article/i })).toHaveCount(0);
    await expect(page.getByRole('link', { name: /Edit Article/i })).toHaveCount(0);

    // - Can see Follow and Favorite buttons
    await expect(page.getByRole('button', { name: /Follow/i }).first()).toBeVisible();
    await expect(page.getByRole('button', { name: /Favorite/i }).first()).toBeVisible();

    // - Can delete their own comment, but NOT author's comment
    // A comment card has the comment body and an optional delete icon for owner
    const readerCommentCard = page.locator('.card', { hasText: readerCommentText });
    const authorCommentCard = page.locator('.card', { hasText: authorCommentText });

    await expect(readerCommentCard.locator('.mod-options i, i.ion-trash-a')).toBeVisible();
    await expect(authorCommentCard.locator('.mod-options i, i.ion-trash-a')).toHaveCount(0);
  });
});