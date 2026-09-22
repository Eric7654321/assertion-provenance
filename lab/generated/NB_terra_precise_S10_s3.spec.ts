import { test, expect } from '@playwright/test';
import { newUser, newArticle, loginAs, UI } from '../support/fixtures';

test.describe('Conduit Acceptance Tests', () => {
  test('Favorite an article', async ({ page }) => {
    const author = await newUser();
    const user = await newUser();
    const article = await newArticle(author);

    await loginAs(page, user);
    await page.goto(`${UI}/#/article/${article.slug}`);

    const favoriteButton = page.getByRole('button', { name: /favorite article/i });

    await expect(favoriteButton).toContainText('0');
    await expect(favoriteButton).not.toHaveClass(/active/);

    await favoriteButton.click();

    await expect(favoriteButton).toContainText('1');
    await expect(favoriteButton).toHaveClass(/active/);
  });
});