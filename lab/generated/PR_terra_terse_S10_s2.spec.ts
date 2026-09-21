import { test, expect } from '@playwright/test';
import { newArticle, newUser, loginAs, UI } from '../support/fixtures';

test('S10: user can favorite an article and the button/count update', async ({ page }) => {
  const author = await newUser();
  const reader = await newUser();
  const article = await newArticle(author);

  await loginAs(page, reader);
  await page.goto(`${UI}/#/article/${article.slug}`);

  const favoriteButton = page.getByRole('button', { name: /favorite article/i });
  await expect(favoriteButton).toContainText('0');
  await expect(favoriteButton).not.toHaveClass(/active/);

  await favoriteButton.click();

  await expect(favoriteButton).toContainText('1');
  await expect(favoriteButton).toHaveClass(/active/);
});