import { test, expect } from '@playwright/test';
import { newUser, newArticle, loginAs, UI } from '../support/fixtures';

test.describe('Conduit Acceptance Tests', () => {
  test('Author deletes their own article', async ({ page }) => {
    // Given I am on my own article page as the author
    const author = await newUser();
    const article = await newArticle(author);

    await loginAs(page, author);
    await page.goto(`${UI}/#/article/${article.slug}`);

    // When I choose to delete the article
    page.on('dialog', async (dialog) => {
      await dialog.accept();
    });

    const deleteBtn = page.getByRole('button', { name: /Delete Article/ }).first();
    await expect(deleteBtn).toBeVisible();
    await deleteBtn.click();

    // Then the article no longer appears in the article list on the home page
    await page.waitForURL(`${UI}/#/`);

    // Ensure we are viewing the global feed or your feed where articles are listed
    const globalFeedTab = page.getByRole('button', { name: 'Global Feed' });
    if (await globalFeedTab.isVisible()) {
      await globalFeedTab.click();
    }

    await expect(page.getByRole('heading', { name: article.title })).not.toBeVisible();
  });
});