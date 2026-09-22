import { test, expect } from '@playwright/test';
import { newUser, newArticle, loginAs, UI } from '../support/fixtures';

test.describe('Conduit Acceptance Tests', () => {
  test('@item:S07 Author deletes their own article', async ({ page }) => {
    const user = await newUser();
    const article = await newArticle(user);

    await loginAs(page, user);
    await page.goto(`${UI}/#/article/${article.slug}`);

    await expect(page.getByRole('button', { name: /delete article/i })).toBeVisible();
    await page.getByRole('button', { name: /delete article/i }).click();

    await page.waitForURL(/#\/?$/);

    await expect(page.getByRole('link', { name: article.title })).not.toBeVisible();
  });
});