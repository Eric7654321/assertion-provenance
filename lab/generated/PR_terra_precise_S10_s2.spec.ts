import { expect, test } from '@playwright/test';
import { loginAs, newArticle, newUser, UI } from '../support/fixtures';

test('S10: user can favorite an article', async ({ page }) => {
  const author = await newUser();
  const reader = await newUser();
  const article = await newArticle(author, {
    favoritesCount: 0,
  });

  await loginAs(page, reader);
  await page.goto(`${UI}/#/article/${article.slug}`);

  const favoriteButton = page.getByRole('button', { name: /favorite article/i });

  await expect(favoriteButton).toContainText('0');
  await expect(favoriteButton).not.toHaveClass(/active/);

  await favoriteButton.click();

  await expect(favoriteButton).toContainText('1');
  await expect(favoriteButton).toHaveClass(/active/);
});