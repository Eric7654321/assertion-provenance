import { test, expect } from '@playwright/test';
import { newUser, newArticle, loginAs, UI } from '../support/fixtures';

test.describe('Conduit Acceptance Requirements', () => {
  test('@item:S10 Favorite an article', async ({ page }) => {
    // Given an article with an initial favorite count of 0 is opened and not yet favorited
    const author = await newUser();
    const reader = await newUser();
    const article = await newArticle(author);

    await loginAs(page, reader);
    await page.goto(`${UI}/#/article/${article.slug}`);

    const favoriteButton = page.getByRole('button', { name: /Favorite\s*\(\s*0\s*\)/i }).first();
    await expect(favoriteButton).toBeVisible();

    // When the user clicks favorite
    await favoriteButton.click();

    // Then the button and count should reflect the action
    const favoritedButton = page.getByRole('button', { name: /Favorite\s*\(\s*1\s*\)|Unfavorite\s*\(\s*1\s*\)/i }).first();
    await expect(favoritedButton).toBeVisible();
    await expect(favoritedButton).toContainText('1');
  });
});