import { test, expect } from '@playwright/test';
import { newUser, newArticle, loginAs, UI } from '../support/fixtures';

test.describe('Conduit Acceptance Tests', () => {
  test('S07: Author deletes own article', async ({ page }) => {
    const author = await newUser();
    const article = await newArticle(author);

    await loginAs(page, author);

    await page.goto(`${UI}/#/article/${article.slug}`);

    await expect(page.getByRole('button', { name: /delete article/i })).toBeVisible();
    await page.getByRole('button', { name: /delete article/i }).click();

    await expect(page).toHaveURL(new RegExp(`${UI.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}/#/?$`));

    await expect(page.getByRole('link', { name: article.title })).toHaveCount(0);
  });
});