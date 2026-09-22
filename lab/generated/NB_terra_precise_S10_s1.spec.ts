import { test, expect } from '@playwright/test';
import { newUser, newArticle, loginAs, UI } from '../support/fixtures';

test.describe('Conduit Acceptance Tests', () => {
  test('@item:S10 Favorite an article', async ({ page }) => {
    const author = await newUser();
    const viewer = await newUser();
    const article = await newArticle(author, { favoritesCount: 0 });

    await loginAs(page, viewer);
    await page.goto(`${UI}/#/article/${article.slug}`);

    const favoriteButton = page.getByRole('button', {
      name: /favorite article/i,
    });

    await expect(favoriteButton).toContainText('0');
    await expect(favoriteButton).toHaveClass(/btn-outline-primary/);

    await favoriteButton.click();

    await expect(favoriteButton).toContainText('1');
    await expect(favoriteButton).toHaveClass(/btn-primary/);
  });
});