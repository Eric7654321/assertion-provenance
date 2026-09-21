import { expect, test } from '@playwright/test';
import { loginAs, newArticle, newUser, UI } from '../support/fixtures';

test.describe('Conduit Acceptance Tests', () => {
  test('@item:S10 Favorite article', async ({ page }) => {
    const author = await newUser();
    const user = await newUser();
    const article = await newArticle(author);

    await loginAs(page, user);
    await page.goto(`${UI}/#/article/${article.slug}`);

    const favoriteButton = page.getByRole('button', {
      name: new RegExp(`Favorite Article\\s*\\(0\\)`, 'i'),
    });

    await expect(favoriteButton).toBeVisible();
    await expect(favoriteButton).toHaveText(/0/);

    await favoriteButton.click();

    await expect(
      page.getByRole('button', {
        name: new RegExp(`Unfavorite Article\\s*\\(1\\)`, 'i'),
      }),
    ).toBeVisible();
  });
});