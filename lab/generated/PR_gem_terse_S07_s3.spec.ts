import { test, expect } from '@playwright/test';
import { newUser, newArticle, loginAs, UI } from '../support/fixtures';

test.describe('Conduit Acceptance Tests', () => {
  test('Author deletes their own article', async ({ page }) => {
    const author = await newUser();
    const article = await newArticle(author);

    await loginAs(page, author);

    // Given the author opens their own article page
    await page.goto(`${UI}/#/article/${article.slug}`);
    await expect(page.getByRole('heading', { name: article.title })).toBeVisible();

    // When the author clicks to delete the article
    await page.getByRole('button', { name: 'Delete Article' }).first().click();

    // Then the article disappears from the list after deletion
    // Usually Conduit redirects to home or profile after deletion
    await page.waitForURL(`${UI}/#/`);

    // Ensure the deleted article is not present in Global Feed
    await page.getByRole('button', { name: 'Global Feed' }).click();
    await expect(page.getByText(article.title)).not.toBeVisible();
  });
});