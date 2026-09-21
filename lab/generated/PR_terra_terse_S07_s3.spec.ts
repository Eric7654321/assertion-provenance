import { expect, test } from '@playwright/test';
import { loginAs, newArticle, newUser, UI } from '../support/fixtures';

test.describe('Conduit Acceptance Tests', () => {
  test('S07: Author deletes their own article', async ({ page }) => {
    const author = await newUser();
    const article = await newArticle(author);

    await loginAs(page, author);
    await page.goto(`${UI}/#/article/${article.slug}`);

    await expect(page.getByRole('heading', { name: article.title })).toBeVisible();

    await page.getByRole('button', { name: /delete article/i }).click();

    await expect(page).toHaveURL(new RegExp(`${UI.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}/#/?$`));
    await expect(page.getByRole('link', { name: article.title })).toHaveCount(0);
  });
});