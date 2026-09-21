import { test, expect } from '@playwright/test';
import { newUser, newArticle, loginAs, UI } from '../support/fixtures';

test.describe('Conduit Acceptance Tests', () => {
  test('Favorite article', async ({ page }) => {
    // Given an article has an initial favorite count of 0 and has not been favorited
    const author = await newUser();
    const article = await newArticle(author);

    const reader = await newUser();
    await loginAs(page, reader);

    // When the user opens the article and clicks to favorite it
    await page.goto(`${UI}/#/article/${article.slug}`);

    const favoriteButton = page.getByRole('button', { name: /Favorite/ }).first();
    await expect(favoriteButton).toContainText('Favorite ( 0 )');

    await favoriteButton.click();

    // Then the button and the count reflect this action
    await expect(favoriteButton).toContainText('Favorite ( 1 )');
  });
});