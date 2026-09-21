import { test, expect } from '@playwright/test';
import { newUser, newArticle, loginAs, UI } from '../support/fixtures';

test.describe('Conduit Acceptance Tests', () => {
  test('Author deletes own article', async ({ page }) => {
    // Given an author opens their own article page
    const author = await newUser();
    const article = await newArticle(author);

    await loginAs(page, author);
    await page.goto(`${UI}/#/article/${article.slug}`);

    // When the author deletes the article
    await page.getByRole('button', { name: /Delete Article/ }).first().click();

    // Then the article no longer appears in the article list on the home page
    await expect(page).toHaveURL(`${UI}/#/`);
    await page.getByRole('button', { name: 'Global Feed' }).click();
    await expect(page.getByRole('heading', { name: article.title })).not.toBeVisible();
  });
});