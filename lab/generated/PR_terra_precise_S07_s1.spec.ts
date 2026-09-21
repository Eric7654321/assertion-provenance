import { test, expect } from '@playwright/test';
import { newArticle, newUser, loginAs, UI } from '../support/fixtures';

test.describe('Conduit Acceptance Tests', () => {
  test('S07: Author deletes their own article', async ({ page }) => {
    const user = await newUser();
    const article = await newArticle(user);

    await loginAs(page, user);
    await page.goto(`${UI}/#/article/${article.slug}`);

    const deleteButton = page.getByRole('button', { name: /delete article/i });
    await expect(deleteButton).toBeVisible();
    await deleteButton.click();

    await expect(page).toHaveURL(new RegExp(`${UI.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}/#/?$`));

    await expect(
      page.getByRole('link', { name: article.title })
    ).not.toBeVisible();
  });
});