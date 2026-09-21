import { test, expect } from '@playwright/test';
import { newUser, newArticle, loginAs, UI } from '../support/fixtures';

test.describe('Conduit Acceptance Requirements', () => {
  test('Favorite an article', async ({ page }) => {
    // Given an article has an initial favorite count of 0 and has not been favorited
    const author = await newUser();
    const article = await newArticle(author);
    const user = await newUser();

    await loginAs(page, user);

    // When the user opens the article and clicks favorite
    await page.goto(`${UI}/#/article/${article.slug}`);

    const favoriteBtn = page.getByRole('button', { name: /Favorite\s*\(\s*0\s*\)/i }).first();
    await expect(favoriteBtn).toBeVisible();
    await favoriteBtn.click();

    // Then the button and the count should reflect this action
    const favoritedBtn = page.getByRole('button', { name: /Unfavorite|Favorite/i }).filter({ hasText: /\(\s*1\s*\)/ }).first();
    await expect(favoritedBtn).toBeVisible();
  });
});