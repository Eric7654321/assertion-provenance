import { test, expect } from '@playwright/test';
import { newUser, newArticle, loginAs, apiCall, UI } from '../support/fixtures';

test.describe('Article page visibility and permissions', () => {
  test('H02: what visitors and different users see and can perform should differ based on their role', async ({ page }) => {
    // 1. Given an author creates an article and leaves a comment under it
    const author = await newUser();
    const article = await newArticle(author, {
      title: 'H02 Permissions Article',
      description: 'Testing permissions and visibility',
      body: 'This is the article body created by author.',
      tagList: ['permissions', 'test'],
    });

    const authorCommentText = 'Author comment for H02';
    await apiCall(`articles/${article.slug}/comments`, 'POST', {
      comment: { body: authorCommentText },
    }, author.token);

    // 2. When an unauthenticated visitor opens the article page
    await page.goto(`${UI}/#/article/${article.slug}`);

    // 3. Then what the visitor sees and the actions they can perform should differ based on their role
    // Visitor should see article title, body, and the author comment
    await expect(page.getByRole('heading', { name: article.title })).toBeVisible();
    await expect(page.getByText(article.body)).toBeVisible();
    await expect(page.getByText(authorCommentText)).toBeVisible();

    // Visitor cannot edit/delete article or post comments; sees sign in / sign up prompts instead
    await expect(page.getByRole('button', { name: /Delete Article/i })).toHaveCount(0);
    await expect(page.getByRole('link', { name: /Edit Article/i })).toHaveCount(0);
    await expect(page.getByPlaceholder('Write a comment...')).toHaveCount(0);
    await expect(page.getByRole('button', { name: 'Post Comment' })).toHaveCount(0);
    await expect(page.getByRole('link', { name: 'Sign in' })).toBeVisible();

    // Visitor should not see comment delete buttons (mod-options)
    await expect(page.locator('.mod-options')).toHaveCount(0);

    // 4. When another logged-in user who is not the author opens the same page
    const reader = await newUser();
    await loginAs(page, reader);
    await page.goto(`${UI}/#/article/${article.slug}`);

    // Reader sees article content and author's comment
    await expect(page.getByRole('heading', { name: article.title })).toBeVisible();
    await expect(page.getByText(authorCommentText)).toBeVisible();

    // Reader is not author: cannot edit or delete the article
    await expect(page.getByRole('button', { name: /Delete Article/i })).toHaveCount(0);
    await expect(page.getByRole('link', { name: /Edit Article/i })).toHaveCount(0);

    // Reader can follow author and favorite article
    await expect(page.getByRole('button', { name: /Follow/i }).first()).toBeVisible();
    await expect(page.getByRole('button', { name: /Favorite/i }).first()).toBeVisible();

    // Reader cannot delete author's comment
    // Only the author of a comment should have the delete icon on their comment card
    const authorCard = page.locator('.card', { hasText: authorCommentText });
    await expect(authorCard.locator('i.ion-trash-a, button.btn-outline-danger, .mod-options')).toHaveCount(0);

    // 5. And this user leaves their own comment on the page
    const readerCommentText = 'Reader comment for H02';
    await expect(page.getByPlaceholder('Write a comment...')).toBeVisible();
    await page.getByPlaceholder('Write a comment...').fill(readerCommentText);
    await page.getByRole('button', { name: 'Post Comment' }).click();

    // 6. Then what this user sees and the actions they can perform should differ based on their role
    // Reader's comment is now visible
    await expect(page.getByText(readerCommentText)).toBeVisible();

    // Reader CAN delete their own comment
    const readerCard = page.locator('.card', { hasText: readerCommentText });
    await expect(readerCard.locator('i.ion-trash-a, .mod-options')).toBeVisible();

    // But reader still cannot delete author's comment
    await expect(authorCard.locator('i.ion-trash-a, .mod-options')).toHaveCount(0);
  });
});