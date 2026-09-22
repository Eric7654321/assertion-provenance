import { test, expect } from '@playwright/test';
import { newUser, newArticle, loginAs, UI } from '../support/fixtures';

test.describe('Conduit Acceptance Criteria', () => {
  test('S10 - Favorite an article', async ({ page }) => {
    const author = await newUser();
    const article = await newArticle(author);

    const user = await newUser();
    await loginAs(page, user);

    await page.goto(`${UI}/#/article/${article.slug}`);

    const favoriteButton = page.locator('button').filter({
      hasText: /Favorite Article/i,
    });

    await expect(favoriteButton).toBeVisible();
    await expect(favoriteButton).toContainText('0');

    await favoriteButton.click();

    const unfavoriteButton = page.locator('button').filter({
      hasText: /Unfavorite Article/i,
    });

    await expect(unfavoriteButton).toBeVisible();
    await expect(unfavoriteButton).toContainText('1');
  });
});