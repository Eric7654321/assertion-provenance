import { expect, test } from '@playwright/test';
import { loginAs, newArticle, newUser, UI } from '../support/fixtures';

test.describe('Conduit Acceptance Tests', () => {
  test('@item:S10 Favorite an article', async ({ page }) => {
    const author = await newUser();
    const viewer = await newUser();
    const article = await newArticle(author);

    await loginAs(page, viewer);
    await page.goto(`${UI}/#/article/${article.slug}`);

    const favoriteButton = page.getByRole('button', { name: /favorite article/i });

    await expect(favoriteButton).toContainText('0');
    await favoriteButton.click();

    await expect(favoriteButton).toContainText('1');
    await expect(favoriteButton).toHaveAttribute('class', /btn-primary/);
  });
});